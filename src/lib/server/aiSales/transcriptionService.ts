import "server-only";

import { createHash } from "node:crypto";
import { resolveDiskDownloadUrl } from "@/lib/server/bitrix/entities";
import { getTranscriptionProviderFromSettings } from "@/lib/transcription";
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

const MAX_POLLS = 180; // ~3 часа при runAfter 60с — чтобы opId не отваливались, пока ждут очередь self-hosted при бэклоге
const POLL_INTERVAL_MS = 60_000;

interface TranscribePayload {
  callId: string;
  operationId?: string;
  polls?: number;
}

/** Извлечь fileId из raw активности звонка. */
function fileIdFromRaw(raw: unknown): string | null {
  const r = raw as { FILES?: Array<{ id?: unknown }> } | null;
  const f = r?.FILES?.[0]?.id;
  return f != null ? String(f) : null;
}

async function afterTranscribed(callId: string): Promise<void> {
  await setCallStatus(callId, "TRANSCRIBED");
  // Гибрид: если включена диаризация pyannote — сначала разделяем спикеров на своём
  // сервере (call.diarize сам поставит call.roles), иначе сразу к ролям.
  const { getDiarizationSetting } = await import("@/lib/server/aiSales/settingsDb");
  const diar = await getDiarizationSetting();
  if (diar === "pyannote" || diar === "selfhosted") {
    await enqueueJob({
      type: "call.diarize",
      payload: { callId },
      idempotencyKey: `diarize:${callId}`,
      priority: 54,
    });
    return;
  }
  await enqueueJob({
    type: "call.roles",
    payload: { callId },
    idempotencyKey: `roles:${callId}`,
    priority: 55,
  });
}

export async function runTranscription(payload: TranscribePayload): Promise<unknown> {
  const call = await getCallById(payload.callId);
  if (!call) throw new Error(`Звонок не найден: ${payload.callId}`);
  if (!call.recording_url) {
    await setCallStatus(call.id, "NO_RECORDING");
    return { skipped: "no recording" };
  }

  const provider = await getTranscriptionProviderFromSettings();

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
        runAfter: new Date(Date.now() + POLL_INTERVAL_MS),
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
  // Прямая ссылка на запись (self-hosted сервис скачает сам; иначе — качаем байты).
  const downloadUrl = await resolveDiskDownloadUrl(resolvedFileId);
  if (!downloadUrl) throw new Error("Не удалось получить DOWNLOAD_URL записи");

  // sync ИЛИ async с Object Storage — нужны байты (для распознавания/загрузки + хэш).
  const needBytes = provider.mode === "sync" || provider.needsObjectStorage !== false;
  let audio: Buffer | null = null;
  if (needBytes) {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`Скачивание записи ${res.status}`);
    audio = Buffer.from(await res.arrayBuffer());
    await setCallRecordingHash(call.id, createHash("sha256").update(audio).digest("hex"));
  }
  await setCallStatus(call.id, "TRANSCRIBING");

  if (provider.mode === "sync") {
    if (!provider.transcribe) throw new Error("Провайдер не поддерживает transcribe");
    const result = await provider.transcribe({ audioBuffer: audio!, languageHint: "ru" });
    await saveTranscript(call.id, result);
    await afterTranscribed(call.id);
    return { transcribed: true, segments: result.segments.length };
  }

  if (!provider.startAsync) throw new Error("Провайдер не поддерживает startAsync");

  // audioUri: для Yandex — Object Storage; для self-hosted — прямой URL записи.
  let audioUri: string;
  if (provider.needsObjectStorage !== false) {
    if (!objectStorageConfigured()) {
      throw new Error(
        "Для этого провайдера нужен Object Storage (YANDEX_S3_*). Настройте хранилище или используйте TRANSCRIPTION_PROVIDER=selfhosted/whisper."
      );
    }
    const put = await putObject(`calls/${call.id}.mp3`, audio!, "audio/mpeg");
    audioUri = put.uri;
  } else {
    audioUri = downloadUrl;
  }
  const started = await provider.startAsync(audioUri, "ru-RU");
  await enqueueJob({
    type: "call.transcribe",
    payload: { callId: call.id, operationId: started.operationId, polls: 0 },
    runAfter: new Date(Date.now() + 30_000),
    priority: 50,
  });
  return { started: true, operationId: started.operationId };
}
