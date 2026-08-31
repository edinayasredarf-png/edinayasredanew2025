import "server-only";

import { WhisperProvider } from "@/lib/transcription/providers/whisper";
import { YandexSpeechKitProvider } from "@/lib/transcription/providers/yandexSpeechKit";
import type { TranscriptionProvider } from "@/lib/transcription/interfaces";

export * from "@/lib/transcription/interfaces";

/**
 * Фабрика STT-провайдера.
 *   TRANSCRIPTION_PROVIDER = yandex | whisper
 * По умолчанию — yandex (соответствует рабочему пайплайну «Единой среды»);
 * whisper — zero-infra альтернатива для локального теста.
 */
let cached: TranscriptionProvider | null = null;

export function getTranscriptionProvider(): TranscriptionProvider {
  if (cached) return cached;
  const provider = (process.env.TRANSCRIPTION_PROVIDER || "yandex").trim();
  switch (provider) {
    case "whisper":
      cached = new WhisperProvider();
      return cached;
    case "yandex":
    case "yandex_speechkit":
    default:
      cached = new YandexSpeechKitProvider();
      return cached;
  }
}
