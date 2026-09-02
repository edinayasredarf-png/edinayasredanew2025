import "server-only";

import { WhisperProvider } from "@/lib/transcription/providers/whisper";
import { YandexSpeechKitProvider } from "@/lib/transcription/providers/yandexSpeechKit";
import { SelfHostedSttProvider } from "@/lib/transcription/providers/selfHosted";
import type { TranscriptionProvider } from "@/lib/transcription/interfaces";

export * from "@/lib/transcription/interfaces";

/**
 * Фабрика STT-провайдера.
 *   TRANSCRIPTION_PROVIDER = yandex | selfhosted | whisper
 *   • yandex     — Yandex SpeechKit (облако, без GPU; на моно — без диаризации);
 *   • selfhosted — свой микросервис faster-whisper + pyannote (диаризация на моно);
 *   • whisper    — Whisper-совместимый endpoint.
 */
let cached: TranscriptionProvider | null = null;

export function getTranscriptionProvider(): TranscriptionProvider {
  if (cached) return cached;
  const provider = (process.env.TRANSCRIPTION_PROVIDER || "yandex").trim();
  switch (provider) {
    case "whisper":
      cached = new WhisperProvider();
      return cached;
    case "selfhosted":
    case "self_hosted":
      cached = new SelfHostedSttProvider();
      return cached;
    case "yandex":
    case "yandex_speechkit":
    default:
      cached = new YandexSpeechKitProvider();
      return cached;
  }
}
