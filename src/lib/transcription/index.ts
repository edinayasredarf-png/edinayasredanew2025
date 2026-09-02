import "server-only";

import { WhisperProvider } from "@/lib/transcription/providers/whisper";
import { YandexSpeechKitProvider } from "@/lib/transcription/providers/yandexSpeechKit";
import { YandexSpeechKitV3Provider } from "@/lib/transcription/providers/yandexSpeechKitV3";
import { SelfHostedSttProvider } from "@/lib/transcription/providers/selfHosted";
import type { TranscriptionProvider } from "@/lib/transcription/interfaces";

export * from "@/lib/transcription/interfaces";

/**
 * Фабрика STT-провайдера.
 *   TRANSCRIPTION_PROVIDER = yandex | yandex_v3 | selfhosted | whisper
 *   • yandex     — SpeechKit v2 longRunning (моно, без диаризации);
 *   • yandex_v3  — SpeechKit v3 + speaker labeling (диаризация в облаке на моно);
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
    case "yandex_v3":
    case "yandex_speechkit_v3":
      cached = new YandexSpeechKitV3Provider();
      return cached;
    case "yandex":
    case "yandex_speechkit":
    default:
      cached = new YandexSpeechKitProvider();
      return cached;
  }
}
