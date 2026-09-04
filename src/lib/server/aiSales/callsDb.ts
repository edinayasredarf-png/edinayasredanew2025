import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import type { BxCallActivity } from "@/lib/server/bitrix/entities";
import type { TranscriptionResult } from "@/lib/transcription/interfaces";
import type { CallAnalysis } from "@/lib/ai/schemas/callAnalysis";

export type CallStatus =
  | "PENDING"
  | "DOWNLOADING"
  | "TRANSCRIBING"
  | "TRANSCRIBED"
  | "ANALYZING"
  | "COMPLETED"
  | "FAILED"
  | "RETRY_PENDING"
  | "NO_RECORDING";

export interface CallRow {
  id: string;
  bitrix_call_id: string | null;
  bitrix_activity_id: string | null;
  bitrix_deal_id: string | null;
  bitrix_lead_id: string | null;
  bitrix_contact_id: string | null;
  bitrix_company_id: string | null;
  bitrix_user_id: string | null;
  direction: string | null;
  phone_number: string | null;
  started_at: Date | null;
  duration_sec: number | null;
  recording_url: string | null;
  recording_hash: string | null;
  product: string | null;
  status: CallStatus;
  created_at: Date;
  updated_at: Date;
}

/** Апсерт звонка из CRM-активности. Идемпотентно по bitrix_activity_id. */
export async function upsertCallFromActivity(a: BxCallActivity): Promise<string> {
  const pool = getTimewebPool();
  const status: CallStatus = a.recordingUrl ? "PENDING" : "NO_RECORDING";
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_calls (
       bitrix_activity_id, bitrix_deal_id, bitrix_lead_id, bitrix_contact_id,
       bitrix_company_id, bitrix_user_id, direction, started_at, duration_sec,
       phone_number, recording_url, status, raw, updated_at
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb, now())
     on conflict (bitrix_activity_id) do update set
       bitrix_deal_id = excluded.bitrix_deal_id,
       bitrix_lead_id = excluded.bitrix_lead_id,
       bitrix_contact_id = excluded.bitrix_contact_id,
       bitrix_company_id = excluded.bitrix_company_id,
       bitrix_user_id = excluded.bitrix_user_id,
       direction = excluded.direction,
       started_at = excluded.started_at,
       phone_number = excluded.phone_number,
       recording_url = excluded.recording_url,
       raw = excluded.raw,
       updated_at = now()
     returning id`,
    [
      a.bitrixActivityId, a.bitrixDealId, a.bitrixLeadId, a.bitrixContactId,
      a.bitrixCompanyId, a.bitrixUserId, a.direction, a.startedAt, a.durationSec,
      a.phone, a.recordingUrl, status, JSON.stringify(a.raw),
    ]
  );
  return rows[0].id;
}

export async function getCallById(id: string): Promise<CallRow | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<CallRow>(`select * from ai_calls where id = $1`, [id]);
  return rows[0] ?? null;
}

export async function setCallStatus(id: string, status: CallStatus): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(`update ai_calls set status = $2, updated_at = now() where id = $1`, [id, status]);
}

export async function setCallRecordingHash(id: string, hash: string): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(`update ai_calls set recording_hash = $2, updated_at = now() where id = $1`, [id, hash]);
}

export async function setCallProduct(id: string, product: string | null): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(`update ai_calls set product = $2, updated_at = now() where id = $1`, [id, product]);
}

/** Сохранить транскрипт + сегменты (реплики с таймкодами). Идемпотентно (1:1 к звонку). */
export async function saveTranscript(callId: string, t: TranscriptionResult): Promise<string> {
  const pool = getTimewebPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`delete from ai_transcripts where call_id = $1`, [callId]);
    const { rows } = await client.query<{ id: string }>(
      `insert into ai_transcripts (call_id, provider, language, full_text, duration_sec)
       values ($1,$2,$3,$4,$5) returning id`,
      [callId, t.provider, t.language, t.fullText, t.durationSec]
    );
    const transcriptId = rows[0].id;
    for (const s of t.segments) {
      await client.query(
        `insert into ai_transcript_segments (transcript_id, idx, speaker_label, role, start_ms, end_ms, text, words)
         values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
         on conflict (transcript_id, idx) do nothing`,
        [transcriptId, s.idx, s.speakerLabel, null, s.startMs, s.endMs, s.text, s.words ? JSON.stringify(s.words) : null]
      );
    }
    // Длительность звонка — из STT (в Bitrix её нет надёжно).
    if (t.durationSec != null) {
      await client.query(`update ai_calls set duration_sec = $2 where id = $1`, [callId, Math.round(t.durationSec)]);
    }
    await client.query("commit");
    return transcriptId;
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

export interface TranscriptWithSegments {
  id: string;
  provider: string;
  language: string | null;
  fullText: string | null;
  durationSec: number | null;
  segments: Array<{
    idx: number;
    speakerLabel: string | null;
    role: string | null;
    startMs: number | null;
    endMs: number | null;
    text: string;
    words?: Array<{ text: string; startMs: number | null; endMs: number | null }> | null;
  }>;
}

export async function getTranscript(callId: string): Promise<TranscriptWithSegments | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{
    id: string; provider: string; language: string | null; full_text: string | null; duration_sec: number | null;
  }>(`select id, provider, language, full_text, duration_sec from ai_transcripts where call_id = $1`, [callId]);
  const t = rows[0];
  if (!t) return null;
  const seg = await pool.query<{
    idx: number; speaker_label: string | null; role: string | null; start_ms: number | null; end_ms: number | null; text: string;
    words: Array<{ text: string; startMs: number | null; endMs: number | null }> | null;
  }>(
    `select idx, speaker_label, role, start_ms, end_ms, text, words
       from ai_transcript_segments where transcript_id = $1 order by idx asc`,
    [t.id]
  );
  return {
    id: t.id,
    provider: t.provider,
    language: t.language,
    fullText: t.full_text,
    durationSec: t.duration_sec,
    segments: seg.rows.map((r) => ({
      idx: r.idx,
      speakerLabel: r.speaker_label,
      role: r.role,
      startMs: r.start_ms,
      endMs: r.end_ms,
      text: r.text,
      words: r.words,
    })),
  };
}

/** Полностью заменить сегменты транскрипта (после пословного пересбора по спикерам). */
export async function replaceSegments(
  transcriptId: string,
  segments: Array<{ speakerLabel: string | null; startMs: number | null; endMs: number | null; text: string }>
): Promise<void> {
  const pool = getTimewebPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`delete from ai_transcript_segments where transcript_id = $1`, [transcriptId]);
    let idx = 0;
    for (const s of segments) {
      await client.query(
        `insert into ai_transcript_segments (transcript_id, idx, speaker_label, role, start_ms, end_ms, text)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [transcriptId, idx++, s.speakerLabel, null, s.startMs, s.endMs, s.text]
      );
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

/** Обновить роли сегментов после разметки (MANAGER/CLIENT). */
export async function updateSegmentRoles(
  transcriptId: string,
  roles: Array<{ idx: number; role: string }>
): Promise<void> {
  if (!roles.length) return;
  const pool = getTimewebPool();
  for (const r of roles) {
    await pool.query(
      `update ai_transcript_segments set role = $3 where transcript_id = $1 and idx = $2`,
      [transcriptId, r.idx, r.role]
    );
  }
}

/** Перезаписать метки говорящих (speaker_label) после диаризации pyannote. */
export async function updateSegmentSpeakers(
  transcriptId: string,
  speakers: Array<{ idx: number; speaker: string }>
): Promise<void> {
  if (!speakers.length) return;
  const pool = getTimewebPool();
  for (const s of speakers) {
    await pool.query(
      `update ai_transcript_segments set speaker_label = $3 where transcript_id = $1 and idx = $2`,
      [transcriptId, s.idx, s.speaker]
    );
  }
}

/** Сохранить результат AI-анализа. Идемпотентно по (call_id, input_hash). */
export async function saveAnalysis(input: {
  callId: string;
  provider: string;
  model: string;
  promptVersion: string;
  analysisVersion: string;
  inputHash: string;
  data: CallAnalysis;
}): Promise<string> {
  const pool = getTimewebPool();
  const d = input.data;
  // Несостоявшийся разговор (автоответчик/бот/недозвон): не пишем оценки/температуру
  // в колонки — чтобы они не портили средние и распределения на дашборде.
  const connected = d.connected !== false;
  const dealScore = connected ? d.dealScore.score : null;
  const temperature = connected ? d.dealScore.temperature : null;
  // Оценку менеджера пишем в колонку только для показательных состоявшихся звонков
  // (не недозвон и не краткий уточняющий) — чтобы средние были честными.
  const managerScore =
    connected && d.managerScoreApplicable !== false ? d.managerPerformance.overall : null;
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_call_analysis (
       call_id, provider, model, prompt_version, analysis_version, input_hash,
       summary, result_type, deal_score, deal_temperature, manager_score, next_step, data, confidence
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb)
     on conflict (call_id, input_hash) do update set
       summary = excluded.summary,
       result_type = excluded.result_type,
       deal_score = excluded.deal_score,
       deal_temperature = excluded.deal_temperature,
       manager_score = excluded.manager_score,
       next_step = excluded.next_step,
       data = excluded.data,
       confidence = excluded.confidence
     returning id`,
    [
      input.callId, input.provider, input.model, input.promptVersion, input.analysisVersion, input.inputHash,
      d.summary, connected ? d.result.type : "no_contact", dealScore, temperature,
      managerScore, connected ? (d.nextStep.action ?? null) : null,
      JSON.stringify(d), JSON.stringify(d.confidence),
    ]
  );
  return rows[0].id;
}

/** Существует ли уже анализ с таким input_hash (кэш — не гоняем повторно). */
export async function analysisExists(callId: string, inputHash: string): Promise<boolean> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ id: string }>(
    `select id from ai_call_analysis where call_id = $1 and input_hash = $2 limit 1`,
    [callId, inputHash]
  );
  return rows.length > 0;
}
