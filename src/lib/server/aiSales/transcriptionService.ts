import "server-only";

import { createHash } from "node:crypto";
import { resolveDiskDownloadUrl } from "@/lib/server/bitrix/entities";
import { getTranscriptionProvider } from "@/lib/transcription";
import { putObject, objectStorageConfigured } from "@/lib/storage/objectStorage";
import {
  getCallById,
  setCallStatus,
  setCallRecordingHash,
  saveTranscript,
} from "@/lib/server/aiSales/callsDb";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

/**
 * Оркестрация транскрипции звонка. Драйвится очередью (job call.transcribe):
 *  - sync-провайдер (Whisper): скачали → распознали → сохранили → анализ.
 *  - async-провайдер (Yandex SpeechKit): скачали → загрузили в Object Storage →
 *    startAsync → перепланировали poll; на poll: готово → сохранили → анализ.
 * Не блокируем serverless-функцию на всю длительность распознавания.
 */

const MAX_POLLS = 40; // ~20 минут при runAfter 30с

interface TranscribePayload {
  callId: string;
  operationId?: string;
  polls?: number;
}

async function downloadRecording(fileId: string): Promise<Buffer> {
  const url = await resolveDiskDownloadUrl(fileId);
  if (!url) throw new Error("Не удалось получить DOWNLOAD_URL записи");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Скачивание записи ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Извлечь fileId из raw активности звонка. */
function fileIdFromRaw(raw: unknown): string | null {
  const r = raw as { FILES?: Array<{ id?: unknown }> } | null;
  const f = r?.FILES?.[0]?.id;
  return f != null ? String(f) : null;
}

async function afterTranscribed(callId: string): Promise<void> {
  await setCallStatus(callId, "TRANSCRIBED");
  await enqueueJob({
    type: "call.analyze",
    payload: { callId },
    idempotencyKey: `analyze:${callId}`,
    priority: 60,
  });
}

export async function runTranscription(payload: TranscribePayload): Promise<unknown> {
  const call = await getCallById(payload.callId);
  if (!call) throw new Error(`Звонок не найден: ${payload.callId}`);
  if (!call.recording_url) {
    await setCallStatus(call.id, "NO_RECORDING");
    return { skipped: "no recording" };
  }

  const provider = getTranscriptionProvider();

  // ── Фаза poll (async) ──
  if (payload.operationId) {
    if (!provider.pollAsync) throw new Error("Провайдер не поддерживает pollAsync");
    const poll = await provider.pollAsync(payload.operationId);
    if (!poll.done) {
      const polls = (payload.polls ?? 0) + 1;
      if (polls > MAX_POLLS) throw new Error("Превышено время ожидания транскрипции");
      await enqueueJob({
        type: "call.transcribe",
        payload: { callId: call.id, operationId: payload.operationId, polls },
        runAfter: new Date(Date.now() + 30_000),
        priority: 50,
      });
      return { pending: true, polls };
    }
    if (poll.result) {
      await saveTranscript(call.id, poll.result);
      await afterTranscribed(call.id);
      return { transcribed: true, segments: poll.result.segments.length };
    }
    throw new Error("Пустой результат транскрипции");
  }

  // ── Фаза start ──
  const fileId = fileIdFromRaw(call as unknown as { raw?: unknown }) || null;
  // recording_url = disk.file.get?id=<fileId>; извлечём fileId из него, если нет в raw.
  const idFromUrl = call.recording_url.match(/[?&]id=(\d+)/)?.[1] ?? null;
  const resolvedFileId = fileId || idFromUrl;
  if (!resolvedFileId) throw new Error("Не удалось определить fileId записи");

  await setCallStatus(call.id, "DOWNLOADING");
  const audio = await downloadRecording(resolvedFileId);
  const hash = createHash("sha256").update(audio).digest("hex");
  await setCallRecordingHash(call.id, hash);
  await setCallStatus(call.id, "TRANSCRIBING");

  if (provider.mode === "sync") {
    if (!provider.transcribe) throw new Error("Провайдер не поддерживает transcribe");
    const result = await provider.transcribe({ audioBuffer: audio, languageHint: "ru" });
    await saveTranscript(call.id, result);
    await afterTranscribed(call.id);
    return { transcribed: true, segments: result.segments.length };
  }

  // async: загрузить в Object Storage → startAsync → перепланировать poll.
  if (!objectStorageConfigured()) {
    throw new Error(
      "Для Yandex SpeechKit нужен Object Storage (YANDEX_S3_*). Настройте хранилище или используйте TRANSCRIPTION_PROVIDER=whisper."
    );
  }
  if (!provider.startAsync) throw new Error("Провайдер не поддерживает startAsync");

  const key = `calls/${call.id}.mp3`;
  const put = await putObject(key, audio, "audio/mpeg");
  const started = await provider.startAsync(put.uri, "ru-RU");
  await enqueueJob({
    type: "call.transcribe",
    payload: { callId: call.id, operationId: started.operationId, polls: 0 },
    runAfter: new Date(Date.now() + 30_000),
    priority: 50,
  });
  return { started: true, operationId: started.operationId };
}
