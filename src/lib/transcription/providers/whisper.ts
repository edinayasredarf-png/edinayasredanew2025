import "server-only";

import {
  TranscriptionNotConfiguredError,
  type TranscribeInput,
  type TranscriptionProvider,
  type TranscriptionResult,
  type TranscriptSegment,
} from "@/lib/transcription/interfaces";

/**
 * Whisper-совместимый STT-провайдер (OpenAI-совместимый HTTP endpoint:
 * self-hosted whisper.cpp/faster-whisper за прокси, либо совместимый сервис).
 *
 * ENV:
 *   TRANSCRIPTION_API_URL  — base URL совместимого API (…/v1)
 *   TRANSCRIPTION_API_KEY  — ключ (если требуется)
 *   TRANSCRIPTION_MODEL    — напр. "whisper-1" / "large-v3"
 *
 * Примечание: базовый Whisper НЕ даёт диаризацию (speaker-метки). Если endpoint
 * возвращает сегменты — используем их таймкоды; роли размечаем позже эвристикой
 * (по чередованию / номеру телефона). Полноценная диаризация — отдельный провайдер.
 */

interface WhisperVerboseJson {
  language?: string;
  duration?: number;
  text?: string;
  segments?: Array<{
    id?: number;
    start?: number; // секунды
    end?: number;
    text?: string;
    speaker?: string; // некоторые сервисы добавляют
  }>;
}

export class WhisperProvider implements TranscriptionProvider {
  readonly name = "whisper";
  readonly mode = "sync" as const;

  private cfg() {
    const base = process.env.TRANSCRIPTION_API_URL?.trim();
    if (!base) {
      throw new TranscriptionNotConfiguredError(
        "TRANSCRIPTION_API_URL не задан — транскрипция недоступна"
      );
    }
    return {
      base: base.endsWith("/") ? base.slice(0, -1) : base,
      key: process.env.TRANSCRIPTION_API_KEY?.trim() || "",
      model: process.env.TRANSCRIPTION_MODEL?.trim() || "whisper-1",
    };
  }

  async transcribe(input: TranscribeInput): Promise<TranscriptionResult> {
    const { base, key, model } = this.cfg();

    const buffer = input.audioBuffer ?? (await this.download(input.audioUrl));
    const blob = new Blob([new Uint8Array(buffer)], {
      type: input.mimeType || "audio/mpeg",
    });

    const form = new FormData();
    form.append("file", blob, "call.mp3");
    form.append("model", model);
    form.append("response_format", "verbose_json");
    if (input.languageHint) form.append("language", input.languageHint);

    const res = await fetch(`${base}/audio/transcriptions`, {
      method: "POST",
      headers: key ? { Authorization: `Bearer ${key}` } : undefined,
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`STT вернул ${res.status}: ${detail.slice(0, 300)}`);
    }

    const json = (await res.json()) as WhisperVerboseJson;
    const segments: TranscriptSegment[] = (json.segments || []).map((s, i) => ({
      idx: i,
      speakerLabel: s.speaker ?? null,
      startMs: typeof s.start === "number" ? Math.round(s.start * 1000) : null,
      endMs: typeof s.end === "number" ? Math.round(s.end * 1000) : null,
      text: (s.text || "").trim(),
    }));

    return {
      provider: this.name,
      language: json.language ?? input.languageHint ?? null,
      fullText: (json.text || segments.map((s) => s.text).join(" ")).trim(),
      durationSec: typeof json.duration === "number" ? json.duration : null,
      segments,
    };
  }

  private async download(url?: string): Promise<Buffer> {
    if (!url) throw new Error("Нет audioUrl и audioBuffer для транскрипции");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Не удалось скачать запись: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

// TODO: RussianSTTProvider — российский STT (напр. SaluteSpeech / Yandex SpeechKit)
//       с диаризацией. Реализовать по тому же интерфейсу TranscriptionProvider.
