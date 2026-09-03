import "server-only";

import {
  TranscriptionNotConfiguredError,
  type AsyncPollResult,
  type AsyncStartResult,
  type TranscriptionProvider,
  type TranscriptionResult,
  type TranscriptSegment,
} from "@/lib/transcription/interfaces";

/**
 * Self-hosted STT+диаризация (Фаза 2): микросервис faster-whisper + pyannote на
 * своём сервере (CPU/GPU). Разделяет спикеров на моно и отдаёт сегменты с
 * таймкодами. Диаризация — pyannote; «менеджер/клиент» доразмечает наш roleSplit.
 *
 * Контракт микросервиса (см. speech-service/):
 *   POST {base}/v1/transcribe   { "audio_url": "<url>", "language": "ru" }  -> { "job_id": "..." }
 *   GET  {base}/v1/jobs/{job_id} -> { "status": "queued|processing|done|error",
 *          "error": "...", "result": { "language","duration",
 *            "segments":[{ "start":0.42,"end":4.81,"speaker":"SPEAKER_0","text":"..." }] } }
 *
 * ENV:
 *   SELFHOSTED_STT_URL     — база (https://stt.example.ru)
 *   SELFHOSTED_STT_TOKEN   — Bearer (если сервис защищён)
 *   SELFHOSTED_STT_LANG    — язык (default ru)
 */

interface SelfHostedSegment {
  start?: number;
  end?: number;
  speaker?: string;
  text?: string;
}
interface SelfHostedJob {
  status?: "queued" | "processing" | "done" | "error";
  error?: string;
  result?: {
    language?: string;
    duration?: number;
    segments?: SelfHostedSegment[];
  };
}

export class SelfHostedSttProvider implements TranscriptionProvider {
  readonly name = "selfhosted";
  readonly mode = "async" as const;
  readonly needsObjectStorage = false; // сервис скачивает запись сам по URL

  private cfg() {
    const base = process.env.SELFHOSTED_STT_URL?.trim();
    if (!base) {
      throw new TranscriptionNotConfiguredError(
        "Self-hosted STT не настроен: задайте SELFHOSTED_STT_URL"
      );
    }
    return {
      base: base.endsWith("/") ? base.slice(0, -1) : base,
      token: process.env.SELFHOSTED_STT_TOKEN?.trim() || "",
      lang: process.env.SELFHOSTED_STT_LANG?.trim() || "ru",
    };
  }

  private headers(json = true): Record<string, string> {
    const { token } = this.cfg();
    const h: Record<string, string> = {};
    if (json) h["Content-Type"] = "application/json";
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }

  async startAsync(audioUri: string, languageHint?: string): Promise<AsyncStartResult> {
    const { base, lang } = this.cfg();
    // Whisper ждёт ISO-код без региона ("ru"), а не "ru-RU" (формат Yandex).
    const language = (languageHint || lang).split("-")[0].toLowerCase();
    const res = await fetch(`${base}/v1/transcribe`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ audio_url: audioUri, language }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Self-hosted STT start ${res.status}: ${detail.slice(0, 300)}`);
    }
    const json = (await res.json()) as { job_id?: string };
    if (!json.job_id) throw new Error("Self-hosted STT не вернул job_id");
    return { operationId: json.job_id };
  }

  async pollAsync(operationId: string): Promise<AsyncPollResult> {
    const { base } = this.cfg();
    const res = await fetch(`${base}/v1/jobs/${operationId}`, { headers: this.headers(false) });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Self-hosted STT poll ${res.status}: ${detail.slice(0, 300)}`);
    }
    const job = (await res.json()) as SelfHostedJob;
    if (job.status === "error") throw new Error(`Self-hosted STT error: ${job.error || "unknown"}`);
    if (job.status !== "done") return { done: false };

    const raw = job.result?.segments || [];
    const segments: TranscriptSegment[] = raw
      .filter((s) => (s.text || "").trim())
      .map((s, i) => ({
        idx: i,
        speakerLabel: s.speaker ?? null, // SPEAKER_0/1 → role проставит roleSplit
        startMs: typeof s.start === "number" ? Math.round(s.start * 1000) : null,
        endMs: typeof s.end === "number" ? Math.round(s.end * 1000) : null,
        text: (s.text || "").trim(),
      }));

    const result: TranscriptionResult = {
      provider: this.name,
      language: job.result?.language ?? "ru",
      fullText: segments.map((s) => s.text).join(" ").trim(),
      durationSec: typeof job.result?.duration === "number" ? Math.round(job.result.duration) : null,
      segments,
    };
    return { done: true, result };
  }
}
