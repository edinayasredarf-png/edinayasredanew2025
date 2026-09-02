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
 * Yandex SpeechKit v2 longRunningRecognize (async) — как в рабочем n8n-пайплайне.
 *   start → POST .../speech/stt/v2/longRunningRecognize { audio.uri из Object Storage }
 *   poll  → GET operation.api.cloud.yandex.net/operations/{id}
 *
 * ENV:
 *   YANDEX_STT_API_KEY   — Authorization: Api-Key <...>
 *   YANDEX_FOLDER_ID     — folderId каталога
 *   YANDEX_STT_LANG      — languageCode (default ru-RU)
 *
 * Примечание: mono (audioChannelCount=1) не даёт диаризацию — роли (менеджер/клиент)
 * размечаются отдельным шагом (roleSplit). SpeechKit возвращает chunks с текстом.
 */

interface YandexWord {
  startTime?: string; // "1.230s"
  endTime?: string;
  word?: string;
}
interface YandexOperation {
  id?: string;
  done?: boolean;
  error?: { message?: string };
  response?: {
    chunks?: Array<{
      alternatives?: Array<{ text?: string; words?: YandexWord[] }>;
      channelTag?: string;
    }>;
  };
}

/** "1.230s" → 1230 мс. */
function ytimeMs(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/s$/, ""));
  return Number.isFinite(n) ? Math.round(n * 1000) : null;
}

export class YandexSpeechKitProvider implements TranscriptionProvider {
  readonly name = "yandex_speechkit";
  readonly mode = "async" as const;

  private cfg() {
    const key = process.env.YANDEX_STT_API_KEY?.trim();
    const folderId = process.env.YANDEX_FOLDER_ID?.trim();
    if (!key || !folderId) {
      throw new TranscriptionNotConfiguredError(
        "Yandex SpeechKit не настроен: задайте YANDEX_STT_API_KEY и YANDEX_FOLDER_ID"
      );
    }
    return {
      key,
      folderId,
      lang: process.env.YANDEX_STT_LANG?.trim() || "ru-RU",
    };
  }

  async startAsync(audioUri: string, languageHint?: string): Promise<AsyncStartResult> {
    const { key, folderId, lang } = this.cfg();
    const res = await fetch(
      "https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize",
      {
        method: "POST",
        headers: {
          Authorization: `Api-Key ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            specification: {
              languageCode: languageHint || lang,
              audioEncoding: "MP3",
              audioChannelCount: 1,
              rawResults: false,
            },
            folderId,
          },
          audio: { uri: audioUri },
        }),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`SpeechKit start ${res.status}: ${detail.slice(0, 300)}`);
    }
    const json = (await res.json()) as { id?: string };
    if (!json.id) throw new Error("SpeechKit не вернул operationId");
    return { operationId: json.id };
  }

  async pollAsync(operationId: string): Promise<AsyncPollResult> {
    const { key } = this.cfg();
    const res = await fetch(
      `https://operation.api.cloud.yandex.net/operations/${operationId}`,
      { headers: { Authorization: `Api-Key ${key}` } }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`SpeechKit poll ${res.status}: ${detail.slice(0, 300)}`);
    }
    const op = (await res.json()) as YandexOperation;
    if (!op.done) return { done: false };
    if (op.error) throw new Error(`SpeechKit error: ${op.error.message || "unknown"}`);

    const chunks = op.response?.chunks || [];
    const segments: TranscriptSegment[] = [];
    const parts: string[] = [];
    let maxEndMs: number | null = null;
    chunks.forEach((chunk, i) => {
      const alt = chunk.alternatives?.[0];
      const text = (alt?.text || "").trim();
      if (!text) return;
      parts.push(text);
      // Слово-таймкоды: начало первого слова, конец последнего (для клика по реплике и метрик).
      const words = alt?.words || [];
      const startMs = ytimeMs(words[0]?.startTime);
      const endMs = ytimeMs(words[words.length - 1]?.endTime);
      if (endMs != null) maxEndMs = maxEndMs == null ? endMs : Math.max(maxEndMs, endMs);
      segments.push({
        idx: i,
        speakerLabel: chunk.channelTag ?? null,
        startMs,
        endMs,
        text,
      });
    });

    const result: TranscriptionResult = {
      provider: this.name,
      language: "ru-RU",
      fullText: parts.join(" ").trim(),
      durationSec: maxEndMs != null ? Math.round(maxEndMs / 1000) : null,
      segments,
    };
    return { done: true, result };
  }
}
