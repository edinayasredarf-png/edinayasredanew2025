import "server-only";

import { WhisperProvider } from "@/lib/transcription/providers/whisper";
import { YandexSpeechKitProvider } from "@/lib/transcription/providers/yandexSpeechKit";
import { YandexSpeechKitV3Provider } from "@/lib/transcription/providers/yandexSpeechKitV3";
import { SelfHostedSttProvider } from "@/lib/transcription/providers/selfHosted";
import type { TranscriptionProvider } from "@/lib/transcription/interfaces";

export * from "@/lib/transcription/interfaces";

/**
 * Фабрика STT-провайдера. Провайдер выбирается в UI «Настройки» (ai_settings,
 * ключ transcription.provider), с фолбэком на env TRANSCRIPTION_PROVIDER, затем yandex.
 *   • yandex     — SpeechKit v2 longRunning (моно, без диаризации);
 *   • yandex_v3  — SpeechKit v3 + speaker labeling (диаризация в облаке на моно);
 *   • selfhosted — свой микросервис faster-whisper + pyannote (диаризация на моно, как Voicee);
 *   • whisper    — Whisper-совместимый endpoint.
 */

export const TRANSCRIPTION_PROVIDERS = ["yandex", "yandex_v3", "selfhosted", "whisper"] as const;

function makeProvider(id: string): TranscriptionProvider {
  switch (id) {
    case "whisper":
      return new WhisperProvider();
    case "selfhosted":
    case "self_hosted":
      return new SelfHostedSttProvider();
    case "yandex_v3":
    case "yandex_speechkit_v3":
      return new YandexSpeechKitV3Provider();
    case "yandex":
    case "yandex_speechkit":
    default:
      return new YandexSpeechKitProvider();
  }
}

/** Env-фолбэк (без БД). */
export function getTranscriptionProvider(): TranscriptionProvider {
  return makeProvider((process.env.TRANSCRIPTION_PROVIDER || "yandex").trim());
}

/** Провайдер по настройке из ai_settings (transcription.provider), затем env. */
export async function getTranscriptionProviderFromSettings(): Promise<TranscriptionProvider> {
  const { getTranscriptionSetting } = await import("@/lib/server/aiSales/settingsDb");
  return makeProvider(await getTranscriptionSetting());
}
