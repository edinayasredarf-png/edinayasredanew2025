import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { getTranscriptionProviderFromSettings } from "@/lib/transcription";
import { getAiProvider } from "@/lib/ai";
import { MEETING_BASE_RULES } from "@/lib/ai/prompts/meetingPrompts";
import {
  MeetingAnalysisSchema, MeetingChunkSchema, MeetingSpeakersSchema, MeetingTypePickSchema, type MeetingChunk,
} from "@/lib/ai/schemas/meetingAnalysis";
import { enqueueJob, type AiJobRow } from "@/lib/server/aiSales/jobsDb";
import { getAiConfig, getSettingValue } from "@/lib/server/aiSales/settingsDb";
import {
  getMeeting, getMeetingSegments, getMeetingType, insertNewRecords, listMeetingTypes, saveMeetingSegments,
  setSegmentRoles, updateMeeting, type MeetingType,
} from "@/lib/server/aiSales/meetingsDb";
import { getConversionFileUrl, getConversionState, listRecords, mtsConfigured, startConversion } from "@/lib/server/mtsLink/client";

/**
 * Встречи МТС Линк: синхронизация записей → конвертация в MP4 → распознавание (звук достаёт сервис STT) → роли → анализ по
 * типу встречи (свой промт и скрипт). Звонки всегда в приоритете: распознавание встречи стартует, только когда нет звонков
 * на распознавании (сервис STT считает задачи по одной, длинная встреча заняла бы его надолго).
 */

const PRIORITY = 90; // ниже звонков (40–70), выше брифов (150+)
const MAX_CONV_POLLS = 360;   // ~6 часов при опросе раз в минуту
const MAX_STT_POLLS = 480;    // ~8 часов
const MAX_ERRORS = 6;

/* ───────────── синхронизация ───────────── */

export async function syncMeetings(opts: { days?: number; minDurationSec?: number } = {}): Promise<{ listed: number; added: number }> {
  if (!mtsConfigured()) throw new Error("MTS_LINK_API_KEY не задан");
  const days = Math.min(365, Math.max(1, opts.days ?? 7));
  const from = new Date(Date.now() - days * 86400_000);
  const minDur = opts.minDurationSec ?? Number(await getSettingValue<number>("meetings.minDurationSec", 120));
  let offset = 0, listed = 0, added = 0;
  for (let page = 0; page < 20; page++) {
    const recs = await listRecords({ from, limit: 100, offset });
    if (!recs.length) break;
    listed += recs.length;
    const ids = await insertNewRecords(recs, { minDurationSec: minDur });
    for (const id of ids) {
      await enqueueJob({ type: "meeting.process", payload: { meetingId: id }, priority: PRIORITY, maxAttempts: 3, idempotencyKey: `meeting:process:${id}` });
    }
    added += ids.length;
    if (recs.length < 100) break;
    offset += 100;
  }
  return { listed, added };
}

/* ───────────── конвейер: конвертация → распознавание ───────────── */

interface StepPayload { meetingId: string; convPolls?: number; op?: string; polls?: number; errors?: number }

function again(p: StepPayload, delaySec: number, patch: Partial<StepPayload>) {
  return enqueueJob({ type: "meeting.process", payload: { ...p, ...patch }, priority: PRIORITY, maxAttempts: 3, runAfter: new Date(Date.now() + delaySec * 1000) });
}

async function callsBusy(): Promise<boolean> {
  const { rows } = await getTimewebPool().query(`select 1 from ai_jobs where type in ('call.transcribe','call.diarize') and status in ('PENDING','RETRY_PENDING','RUNNING') and run_after <= now() + interval '5 minutes' limit 1`);
  return rows.length > 0;
}

export async function runMeetingStep(job: AiJobRow): Promise<unknown> {
  const p = job.payload as unknown as StepPayload;
  const m = await getMeeting(p.meetingId);
  if (!m) return { skipped: "встреча не найдена" };
  if (m.status === "COMPLETED" || m.status === "SKIPPED" || m.status === "FAILED" || m.status === "ANALYZING" || m.status === "TRANSCRIBED") return { skipped: `статус ${m.status}` };

  try {
    // 1) конвертация записи в MP4
    if (m.status === "NEW") {
      const conv = await startConversion(m.externalRecordId, 720);
      await updateMeeting(m.id, { status: "CONVERTING", conversionId: conv, error: null });
      await again(p, 45, { convPolls: 0, errors: 0 });
      return { converting: conv };
    }
    if (m.status === "CONVERTING") {
      if (!m.conversionId) { await updateMeeting(m.id, { status: "NEW" }); await again(p, 5, {}); return { restart: true }; }
      const state = await getConversionState(m.conversionId);
      if (state === "failed" || state === "canceled") { await updateMeeting(m.id, { status: "FAILED", error: `Конвертация записи в МТС Линк: ${state}` }); return { failed: state }; }
      if (state !== "completed") {
        const polls = (p.convPolls ?? 0) + 1;
        if (polls > MAX_CONV_POLLS) { await updateMeeting(m.id, { status: "FAILED", error: "Превышено время ожидания конвертации записи" }); return { failed: "timeout" }; }
        await again(p, 60, { convPolls: polls });
        return { state, polls };
      }
      await updateMeeting(m.id, { status: "TRANSCRIBING" });
      await again(p, 1, { op: undefined, polls: 0 });
      return { converted: true };
    }

    // 2) распознавание
    if (m.status === "TRANSCRIBING") {
      const provider = await getTranscriptionProviderFromSettings();
      if (!provider.startAsync || !provider.pollAsync) throw new Error("Провайдер распознавания не поддерживает асинхронный режим (нужен self-hosted STT)");

      if (!p.op) {
        if (await callsBusy()) { await again(p, 120, {}); return { waiting: "идут звонки" }; }
        if (!m.conversionId) throw new Error("Нет ID конвертации");
        const url = await getConversionFileUrl(m.conversionId);
        if (!url) throw new Error("МТС Линк не вернул ссылку на MP4");
        await updateMeeting(m.id, { downloadUrl: url });
        const { operationId } = await provider.startAsync(url, "ru");
        await again(p, 60, { op: operationId, polls: 0 });
        return { started: operationId };
      }

      const poll = await provider.pollAsync(p.op);
      if (!poll.done) {
        const polls = (p.polls ?? 0) + 1;
        if (polls > MAX_STT_POLLS) { await updateMeeting(m.id, { status: "FAILED", error: "Превышено время ожидания распознавания" }); return { failed: "timeout" }; }
        await again(p, 60, { polls });
        return { pending: true, polls };
      }
      const t = poll.result;
      if (!t || !t.segments.length) { await updateMeeting(m.id, { status: "FAILED", error: "Распознавание вернуло пустой результат" }); return { failed: "empty" }; }
      await saveMeetingSegments(m.id, t.segments.map((s, i) => ({ idx: i, speakerLabel: s.speakerLabel, startMs: s.startMs, endMs: s.endMs, text: s.text })));
      await updateMeeting(m.id, { status: "TRANSCRIBED", fullText: t.fullText, downloadUrl: null, ...(t.durationSec ? { durationSec: t.durationSec } : {}) });
      await enqueueJob({ type: "meeting.analyze", payload: { meetingId: m.id }, priority: PRIORITY - 5, maxAttempts: 3, idempotencyKey: `meeting:analyze:${m.id}:${Date.now()}` });
      return { transcribed: t.segments.length };
    }
    return { skipped: `статус ${m.status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const errors = (p.errors ?? 0) + 1;
    if (errors >= MAX_ERRORS) { await updateMeeting(m.id, { status: "FAILED", error: msg.slice(0, 500) }); throw e; }
    await again(p, 300, { errors });
    return { retryInMin: 5, error: msg.slice(0, 200) };
  }
}

/* ───────────── анализ ───────────── */

const fmtTime = (ms: number | null) => {
  if (ms == null) return "";
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

async function meetingModel(): Promise<string | undefined> {
  const own = await getSettingValue<string | undefined>("ai.model.meeting", undefined);
  if (own?.trim()) return own.trim();
  return (await getAiConfig()).analysisModel?.trim() || undefined;
}

export async function analyzeMeeting(meetingId: string, opts: { chunk?: number } = {}): Promise<unknown> {
  const m = await getMeeting(meetingId);
  if (!m) return { skipped: "встреча не найдена" };
  const segs = await getMeetingSegments(meetingId);
  if (!segs.length) { await updateMeeting(meetingId, { status: "FAILED", error: "Нет расшифровки для анализа" }); return { failed: "no transcript" }; }
  await updateMeeting(meetingId, { status: "ANALYZING", error: null });
  const provider = await getAiProvider();
  const model = await meetingModel();

  // 1) роли участников (Сотрудник/Клиент) по первым репликам каждого говорящего
  const labels = [...new Set(segs.map((s) => s.speakerLabel).filter((x): x is string => !!x))];
  let speakers = m.speakers;
  if (!speakers.length || opts.chunk == null) {
    const samples = labels.map((l) => `Говорящий ${l}:\n${segs.filter((s) => s.speakerLabel === l).slice(0, 8).map((s) => s.text).join(" ").slice(0, 900)}`).join("\n\n");
    try {
      const { data } = await provider.generateStructured({
        schema: MeetingSpeakersSchema, model, maxTokens: 800,
        system: `${MEETING_BASE_RULES}\nОпредели роль каждого говорящего: EMPLOYEE — сотрудник «Единой среды»/«Экостроя» (представляется от компании, ведёт демонстрацию, отвечает на вопросы о системе), CLIENT — представитель клиента (администрация, учреждение, организация), UNKNOWN — не ясно. По возможности укажи имя из расшифровки. Верни СТРОГО JSON {"speakers":[{"label":"<метка>","role":"EMPLOYEE|CLIENT|UNKNOWN","name":"<имя или null>"}]} для каждой метки.`,
        user: `Название встречи: ${m.title ?? "—"}\n\n${samples}`,
      });
      speakers = labels.map((l) => data.speakers.find((s) => s.label === l) ?? { label: l, role: "UNKNOWN" as const, name: null });
    } catch { speakers = labels.map((l) => ({ label: l, role: "UNKNOWN" as const, name: null })); }
    await updateMeeting(meetingId, { speakers });
    await setSegmentRoles(meetingId, Object.fromEntries(speakers.map((s) => [s.label, s.role])));
  }
  const nameOf = (l: string | null) => { const s = speakers.find((x) => x.label === l); return s ? `${s.name || l}${s.role === "EMPLOYEE" ? " (сотрудник)" : s.role === "CLIENT" ? " (клиент)" : ""}` : (l ?? "Участник"); };

  // 2) тип встречи: ручной выбор → совпадение по названию → LLM → «по умолчанию»
  const types = await listMeetingTypes();
  let type: MeetingType | null = m.typeId && m.typeSource === "manual" ? await getMeetingType(m.typeId) : null;
  if (!type) {
    const title = (m.title ?? "").toLowerCase();
    type = types.find((t) => t.keywords.some((k) => k && title.includes(k))) ?? null;
    if (!type && types.length > 1) {
      try {
        const { data } = await provider.generateStructured({
          schema: MeetingTypePickSchema, model, maxTokens: 200,
          system: `Выбери тип встречи из списка по названию и началу расшифровки. Верни СТРОГО JSON {"typeId":"<id из списка или null>"}.\nТипы:\n${types.map((t) => `- ${t.id}: ${t.name} — ${t.description}`).join("\n")}`,
          user: `Название: ${m.title ?? "—"}\n\n${segs.slice(0, 25).map((s) => s.text).join(" ").slice(0, 2500)}`,
        });
        type = types.find((t) => t.id === data.typeId) ?? null;
      } catch { /* возьмём тип по умолчанию */ }
    }
    type = type ?? types.find((t) => t.isDefault) ?? types[0] ?? null;
    await updateMeeting(meetingId, { typeId: type?.id ?? null, typeSource: "auto" });
  }

  // 3) текст расшифровки; длинные встречи — поэтапно (по частям), чтобы укладываться в лимит функции
  const lines = segs.map((s) => `[${fmtTime(s.startMs)}] ${nameOf(s.speakerLabel)}: ${s.text}`);
  const full = lines.join("\n");
  const CHUNK = 40_000;
  let material = full;
  if (full.length > 60_000) {
    const chunks: string[] = []; let cur = "";
    for (const l of lines) { if (cur.length + l.length > CHUNK) { chunks.push(cur); cur = ""; } cur += l + "\n"; }
    if (cur) chunks.push(cur);
    const i = opts.chunk ?? 0;
    const partials: MeetingChunk[] = (m.analysis as { _partials?: MeetingChunk[] } | null)?._partials ?? [];
    if (i < chunks.length) {
      const { data } = await provider.generateStructured({
        schema: MeetingChunkSchema, model, maxTokens: 1800,
        system: `${MEETING_BASE_RULES}\nЭто ЧАСТЬ ${i + 1} из ${chunks.length} длинной встречи. Кратко: summary (5–8 предложений), decisions, actionItems (кто/что/срок), notes (важные факты, потребности, возражения, риски). Верни СТРОГО JSON.`,
        user: chunks[i],
      });
      partials[i] = data;
      await updateMeeting(meetingId, { analysis: { _partials: partials } });
      await enqueueJob({ type: "meeting.analyze", payload: { meetingId, chunk: i + 1 }, priority: PRIORITY - 5, maxAttempts: 3, idempotencyKey: `meeting:analyze:${meetingId}:c${i + 1}:${Date.now()}` });
      return { chunk: i, of: chunks.length };
    }
    material = partials.map((c, k) => `ЧАСТЬ ${k + 1}\nСаммари: ${c?.summary}\nРешения: ${(c?.decisions ?? []).join("; ")}\nЗадачи: ${(c?.actionItems ?? []).map((a) => `${a.who ?? "?"}: ${a.what} (${a.due ?? "без срока"})`).join("; ")}\nЗаметки: ${(c?.notes ?? []).join("; ")}`).join("\n\n");
  }

  // 4) итоговый анализ по промту и скрипту типа встречи
  const steps = type?.steps ?? [];
  const system = [
    MEETING_BASE_RULES,
    type ? `Тип встречи: «${type.name}».\n${type.prompt}` : "",
    steps.length ? `Скрипт встречи (чек-лист). Для каждого шага отметь completed (true/false/null — не применимо) и коротко evidence (цитата/пояснение из расшифровки):\n${steps.map((s) => `- ${s.key}: ${s.title}`).join("\n")}` : "В поле script.steps верни пустой список.",
    `Верни СТРОГО JSON: {"summary":"<саммари 5–10 предложений>","topics":[],"decisions":[],"actionItems":[{"who":null,"what":"","due":null}],"needs":[],"objections":[{"text":"","handled":null}],"risks":[],"nextSteps":[],"sentiment":"positive|neutral|negative|null","employeeFeedback":{"didWell":[],"improve":[]},"script":{"steps":[{"key":"","completed":null,"evidence":null}]}}`,
  ].filter(Boolean).join("\n\n");
  const { data } = await provider.generateStructured({
    schema: MeetingAnalysisSchema, model, maxTokens: 3500, system,
    user: `Название встречи: ${m.title ?? "—"}\nДлительность: ${m.durationSec ? Math.round(m.durationSec / 60) + " мин" : "—"}\n\n${material}`,
  });

  // доля времени по участникам — считаем кодом, не моделью
  const talk = new Map<string, number>();
  for (const s of segs) { const l = s.speakerLabel ?? "?"; talk.set(l, (talk.get(l) ?? 0) + Math.max(0, (s.endMs ?? 0) - (s.startMs ?? 0))); }
  const total = [...talk.values()].reduce((a, b) => a + b, 0) || 1;
  const participants = labels.map((l) => ({ label: l, name: speakers.find((s) => s.label === l)?.name ?? null, role: speakers.find((s) => s.label === l)?.role ?? "UNKNOWN", talkSharePct: Math.round(((talk.get(l) ?? 0) / total) * 100) }));

  const done = data.script.steps.filter((s) => s.completed === true).length;
  const counted = data.script.steps.filter((s) => s.completed !== null).length;
  const scriptScore = steps.length && counted ? Math.round((done / counted) * 100) : null;
  await updateMeeting(meetingId, {
    status: "COMPLETED", analysis: { ...data, participants, typeName: type?.name ?? null, scriptSteps: steps }, summary: data.summary, scriptScore, analyzedAt: true, error: null,
  });
  return { analyzed: true, type: type?.name ?? null, scriptScore };
}
