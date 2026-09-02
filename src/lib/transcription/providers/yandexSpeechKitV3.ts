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
 * Yandex SpeechKit v3 async с РАЗМЕТКОЙ СПИКЕРОВ (speaker labeling) — диаризация
 * в облаке на моно, без своего сервера/GPU. Роли Менеджер/Клиент дальше проставит
 * наш LLM-roleSplit поверх разделённых спикеров.
 *
 *   submit: POST https://stt.api.cloud.yandex.net/stt/v3/recognizeFileAsync  (audio.uri из Object Storage)
 *   poll:   GET  https://operation.api.cloud.yandex.net/operations/{id}
 *   result: GET  https://stt.api.cloud.yandex.net/stt/v3/getRecognition?operationId={id}  (JSON-lines стрим)
 *
 * ENV: те же YANDEX_STT_API_KEY / YANDEX_FOLDER_ID / YANDEX_STT_LANG.
 * Требует Object Storage (как v2) — аудио должно лежать в бакете.
 *
 * ⚠️ Формат ответа getRecognition парсим толерантно (разные поля speaker/channel).
 * Если на первом реальном звонке роли не поделятся — по сырому ответу подстроим.
 */

const STT_HOST = "https://stt.api.cloud.yandex.net";

interface V3Word {
  text?: string;
  startTimeMs?: string | number;
  endTimeMs?: string | number;
}
interface V3Alternative {
  text?: string;
  words?: V3Word[];
  speakerTag?: string | number;
}
interface V3NormalizedText {
  alternatives?: V3Alternative[];
}
interface V3StreamResponse {
  channelTag?: string;
  result?: {
    channelTag?: string;
    final?: V3NormalizedText;
    finalRefinement?: { normalizedText?: V3NormalizedText };
  };
}

const numMs = (v: string | number | undefined): number | null => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};

export class YandexSpeechKitV3Provider implements TranscriptionProvider {
  readonly name = "yandex_v3";
  readonly mode = "async" as const;
  readonly needsObjectStorage = true;

  private cfg() {
    const key = process.env.YANDEX_STT_API_KEY?.trim();
    const folderId = process.env.YANDEX_FOLDER_ID?.trim();
    if (!key || !folderId) {
      throw new TranscriptionNotConfiguredError(
        "Yandex SpeechKit не настроен: задайте YANDEX_STT_API_KEY и YANDEX_FOLDER_ID"
      );
    }
    return { key, folderId, lang: process.env.YANDEX_STT_LANG?.trim() || "ru-RU" };
  }

  async startAsync(audioUri: string, languageHint?: string): Promise<AsyncStartResult> {
    const { key, lang } = this.cfg();
    const res = await fetch(`${STT_HOST}/stt/v3/recognizeFileAsync`, {
      method: "POST",
      headers: { Authorization: `Api-Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        uri: audioUri,
        recognitionModel: {
          model: "general",
          audioFormat: { containerAudio: { containerAudioType: "MP3" } },
          textNormalization: {
            textNormalization: "TEXT_NORMALIZATION_ENABLED",
            profanityFilter: false,
            literatureText: false,
          },
          languageRestriction: {
            restrictionType: "WHITELIST",
            languageCode: [languageHint || lang],
          },
          audioProcessingType: "FULL_DATA",
        },
        speakerLabeling: { speakerLabeling: "SPEAKER_LABELING_ENABLED" },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`SpeechKit v3 start ${res.status}: ${detail.slice(0, 400)}`);
    }
    const json = (await res.json()) as { id?: string };
    if (!json.id) throw new Error("SpeechKit v3 не вернул operation id");
    return { operationId: json.id };
  }

  async pollAsync(operationId: string): Promise<AsyncPollResult> {
    const { key } = this.cfg();
    // 1) статус операции
    const opRes = await fetch(`https://operation.api.cloud.yandex.net/operations/${operationId}`, {
      headers: { Authorization: `Api-Key ${key}` },
    });
    if (!opRes.ok) {
      const detail = await opRes.text().catch(() => "");
      throw new Error(`SpeechKit v3 poll ${opRes.status}: ${detail.slice(0, 300)}`);
    }
    const op = (await opRes.json()) as { done?: boolean; error?: { message?: string } };
    if (op.error) throw new Error(`SpeechKit v3 error: ${op.error.message || "unknown"}`);
    if (!op.done) return { done: false };

    // 2) результат распознавания (JSON-lines поток)
    const rRes = await fetch(`${STT_HOST}/stt/v3/getRecognition?operationId=${operationId}`, {
      headers: { Authorization: `Api-Key ${key}` },
    });
    if (!rRes.ok) {
      const detail = await rRes.text().catch(() => "");
      throw new Error(`SpeechKit v3 getRecognition ${rRes.status}: ${detail.slice(0, 300)}`);
    }
    const body = await rRes.text();
    const objs = parseJsonStream(body);

    const segments: TranscriptSegment[] = [];
    let idx = 0;
    for (const o of objs) {
      const r = (o as V3StreamResponse).result;
      const norm = r?.finalRefinement?.normalizedText ?? r?.final;
      const alts = norm?.alternatives;
      if (!alts || !alts.length) continue;
      const alt = alts[0];
      const text = (alt.text || "").trim();
      if (!text) continue;
      const words = alt.words || [];
      const startMs = numMs(words[0]?.startTimeMs);
      const endMs = numMs(words[words.length - 1]?.endTimeMs);
      const speaker =
        alt.speakerTag != null
          ? `SPEAKER_${alt.speakerTag}`
          : (o as V3StreamResponse).channelTag ?? r?.channelTag ?? null;
      segments.push({ idx: idx++, speakerLabel: speaker, startMs, endMs, text });
    }

    const maxEnd = segments.reduce((m, s) => (s.endMs != null ? Math.max(m, s.endMs) : m), 0);
    const result: TranscriptionResult = {
      provider: this.name,
      language: "ru-RU",
      fullText: segments.map((s) => s.text).join(" ").trim(),
      durationSec: maxEnd > 0 ? Math.round(maxEnd / 1000) : null,
      segments,
    };
    return { done: true, result };
  }
}

/** Разобрать поток из нескольких JSON-объектов (JSON-lines или конкатенация). */
function parseJsonStream(body: string): unknown[] {
  const out: unknown[] = [];
  const trimmed = body.trim();
  if (!trimmed) return out;
  // Попытка 1: единый JSON (массив или объект).
  try {
    const j = JSON.parse(trimmed);
    return Array.isArray(j) ? j : [j];
  } catch {
    /* поток из нескольких объектов ниже */
  }
  // Попытка 2: по строкам.
  for (const line of trimmed.split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    try {
      out.push(JSON.parse(s));
    } catch {
      /* пропускаем незакрытые фрагменты */
    }
  }
  return out;
}
