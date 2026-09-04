import "server-only";

import { resolveDiskDownloadUrl } from "@/lib/server/bitrix/entities";
import { getCallById, getTranscript, replaceSegments } from "@/lib/server/aiSales/callsDb";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

/**
 * Гибридная диаризация: текст даёт Yandex (шаг call.transcribe), а разделение по
 * говорящим — self-hosted pyannote (лёгкий, влезает в CPU-сервер). Здесь мы:
 *   start: берём аудио записи → POST /v1/diarize → operationId, перепланируем poll;
 *   poll:  готово → сопоставляем каждую реплику Yandex со спикером pyannote по
 *          таймкоду (середина реплики) → перезаписываем speaker_label → шаг ролей.
 * Сервис-эндпоинт — тот же сервер, что и SELFHOSTED_STT_URL/TOKEN.
 */

const MAX_POLLS = 30; // ~15 минут при runAfter 30с (pyannote быстрее whisper)

interface Turn { start: number; end: number; speaker: string }
interface DiarPayload { callId: string; operationId?: string; polls?: number }

function cfg() {
  const base = process.env.SELFHOSTED_STT_URL?.trim();
  if (!base) throw new Error("Диаризация не настроена: задайте SELFHOSTED_STT_URL");
  return {
    base: base.endsWith("/") ? base.slice(0, -1) : base,
    token: process.env.SELFHOSTED_STT_TOKEN?.trim() || "",
  };
}

function authHeaders(json = false): Record<string, string> {
  const { token } = cfg();
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function fileIdFromRaw(raw: unknown): string | null {
  const r = raw as { FILES?: Array<{ id?: unknown }> } | null;
  const f = r?.FILES?.[0]?.id;
  return f != null ? String(f) : null;
}

/** Спикер, говоривший в момент t (сек): по включению, иначе — ближайший интервал. */
function speakerAt(turns: Turn[], t: number): string | null {
  let best: string | null = null;
  let bestGap = Infinity;
  for (const turn of turns) {
    if (turn.start <= t && t <= turn.end) return turn.speaker;
    const gap = Math.min(Math.abs(t - turn.start), Math.abs(t - turn.end));
    if (gap < bestGap) { bestGap = gap; best = turn.speaker; }
  }
  return best;
}

const midSec = (a: number | null, b: number | null): number => ((a ?? b ?? 0) + (b ?? a ?? 0)) / 2 / 1000;

interface OutSeg { speakerLabel: string | null; startMs: number | null; endMs: number | null; text: string }

/**
 * Пословное выравнивание: каждому слову Yandex ставим спикера pyannote по таймкоду
 * и режем реплику ровно на границах говорящих. Где вся фраза одного человека —
 * оставляем красивый текст Yandex; где спикер меняется посередине — рвём фразу и
 * склеиваем слова каждого куска (только у таких — «сырой» текст). Пересобираем
 * сегменты заново. Если пословных таймкодов нет — фолбэк: спикер по середине фразы.
 */
async function applyTurns(callId: string, turns: Turn[]): Promise<number> {
  const transcript = await getTranscript(callId);
  if (!transcript) return 0;
  const out: OutSeg[] = [];

  for (const s of transcript.segments) {
    const words = s.words;
    if (!words || !words.length) {
      out.push({ speakerLabel: speakerAt(turns, midSec(s.startMs, s.endMs)), startMs: s.startMs, endMs: s.endMs, text: s.text });
      continue;
    }
    // Разбиваем слова фразы на «прогоны» подряд идущих слов одного спикера.
    const runs: Array<{ speaker: string | null; startMs: number | null; endMs: number | null; parts: string[] }> = [];
    for (const w of words) {
      const spk = speakerAt(turns, midSec(w.startMs, w.endMs));
      const last = runs[runs.length - 1];
      if (last && last.speaker === spk) {
        last.parts.push(w.text);
        if (w.endMs != null) last.endMs = w.endMs;
      } else {
        runs.push({ speaker: spk, startMs: w.startMs, endMs: w.endMs, parts: [w.text] });
      }
    }
    if (runs.length <= 1) {
      // Вся фраза — один спикер: сохраняем нормализованный текст Yandex.
      out.push({ speakerLabel: runs[0]?.speaker ?? null, startMs: s.startMs, endMs: s.endMs, text: s.text });
    } else {
      for (const r of runs) out.push({ speakerLabel: r.speaker, startMs: r.startMs, endMs: r.endMs, text: r.parts.join(" ") });
    }
  }

  await replaceSegments(transcript.id, out);
  return out.length;
}

export async function runDiarization(payload: DiarPayload): Promise<unknown> {
  const call = await getCallById(payload.callId);
  if (!call) throw new Error(`Звонок не найден: ${payload.callId}`);
  const { base } = cfg();

  // ── Фаза poll ──
  if (payload.operationId) {
    const res = await fetch(`${base}/v1/jobs/${payload.operationId}`, { headers: authHeaders(false) });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Диаризация poll ${res.status}: ${detail.slice(0, 300)}`);
    }
    const job = (await res.json()) as { status?: string; error?: string; result?: { turns?: Turn[] } };
    if (job.status === "error") throw new Error(`Диаризация error: ${job.error || "unknown"}`);
    if (job.status !== "done") {
      const polls = (payload.polls ?? 0) + 1;
      if (polls > MAX_POLLS) throw new Error("Превышено время ожидания диаризации");
      await enqueueJob({
        type: "call.diarize",
        payload: { callId: call.id, operationId: payload.operationId, polls },
        runAfter: new Date(Date.now() + 30_000),
        priority: 54,
      });
      return { pending: true, polls };
    }
    const turns = job.result?.turns ?? [];
    const relabelled = await applyTurns(call.id, turns);
    // Диаризация готова — дальше разметка ролей Менеджер/Клиент.
    await enqueueJob({ type: "call.roles", payload: { callId: call.id }, idempotencyKey: `roles:${call.id}`, priority: 55 });
    return { diarized: true, turns: turns.length, relabelled };
  }

  // ── Фаза start ──
  if (!call.recording_url) {
    // Записи нет — без диаризации сразу на роли.
    await enqueueJob({ type: "call.roles", payload: { callId: call.id }, idempotencyKey: `roles:${call.id}`, priority: 55 });
    return { skipped: "no recording" };
  }
  const fileId = fileIdFromRaw((call as unknown as { raw?: unknown }).raw)
    || call.recording_url.match(/[?&]id=(\d+)/)?.[1]
    || null;
  if (!fileId) throw new Error("Не удалось определить fileId записи для диаризации");
  const downloadUrl = await resolveDiskDownloadUrl(fileId);
  if (!downloadUrl) throw new Error("Не удалось получить DOWNLOAD_URL записи");

  const res = await fetch(`${base}/v1/diarize`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ audio_url: downloadUrl }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Диаризация start ${res.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as { job_id?: string };
  if (!json.job_id) throw new Error("Диаризация не вернула job_id");
  await enqueueJob({
    type: "call.diarize",
    payload: { callId: call.id, operationId: json.job_id, polls: 0 },
    runAfter: new Date(Date.now() + 30_000),
    priority: 54,
  });
  return { started: true, operationId: json.job_id };
}
