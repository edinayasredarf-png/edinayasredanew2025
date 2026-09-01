import "server-only";

import {
  AiProviderNotConfiguredError,
  AiValidationError,
  type AiProvider,
  type StructuredRequest,
  type StructuredResult,
} from "@/lib/ai/interfaces";

/**
 * Провайдер YandexGPT (Foundation Models API) — как в рабочем n8n-пайплайне клиента.
 * Структурированного вывода как у Claude тут нет, поэтому: просим строго JSON,
 * достаём JSON из ответа, валидируем Zod-схемой (§46 ТЗ), при провале — ретрай.
 *
 * ENV (переиспользуют ключи SpeechKit, если отдельные не заданы):
 *   YANDEX_GPT_API_KEY   || YANDEX_STT_API_KEY   — Authorization: Api-Key <...>
 *   YANDEX_GPT_FOLDER_ID || YANDEX_FOLDER_ID      — каталог
 *   YANDEX_GPT_MODEL      — напр. "yandexgpt/latest" (по умолчанию) или
 *                           "yandexgpt-32k/latest" для длинных транскриптов
 */

const COMPLETION_URL =
  "https://llm.api.cloud.yandex.net/foundationModels/v1/completion";

interface YandexCompletionResponse {
  result?: {
    alternatives?: Array<{ message?: { text?: string } }>;
    usage?: {
      inputTextTokens?: string | number;
      completionTokens?: string | number;
      totalTokens?: string | number;
    };
  };
}

/** Достать JSON-объект из текста модели (снять ```-ограждения, взять {...}). */
function extractJson(text: string): unknown | null {
  let t = text.trim();
  // Снять markdown-ограждения ```json ... ```
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  const candidate = t.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

const toNum = (v: unknown): number =>
  v == null ? 0 : Number(v) || 0;

export class YandexGptProvider implements AiProvider {
  readonly name = "yandexgpt";
  readonly defaultModel: string;

  constructor() {
    this.defaultModel = process.env.YANDEX_GPT_MODEL?.trim() || "yandexgpt/latest";
  }

  private cfg() {
    const apiKey =
      process.env.YANDEX_GPT_API_KEY?.trim() || process.env.YANDEX_STT_API_KEY?.trim();
    const folderId =
      process.env.YANDEX_GPT_FOLDER_ID?.trim() || process.env.YANDEX_FOLDER_ID?.trim();
    if (!apiKey || !folderId) {
      throw new AiProviderNotConfiguredError(
        "YandexGPT не настроен: задайте YANDEX_GPT_API_KEY/YANDEX_STT_API_KEY и YANDEX_GPT_FOLDER_ID/YANDEX_FOLDER_ID"
      );
    }
    return { apiKey, folderId };
  }

  async generateStructured<T>(
    req: StructuredRequest<T>
  ): Promise<StructuredResult<T>> {
    const { apiKey, folderId } = this.cfg();
    const model = req.model || this.defaultModel;
    const modelUri = `gpt://${folderId}/${model}`;

    const system =
      req.system +
      "\n\nВЕРНИ ОТВЕТ СТРОГО как один валидный JSON-объект требуемой структуры. " +
      "Без markdown, без пояснений, без текста до или после JSON.";

    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const userText =
        attempt === 0
          ? req.user
          : `${req.user}\n\nПРЕДЫДУЩИЙ ОТВЕТ БЫЛ НЕВАЛИДНЫМ JSON. Верни СТРОГО валидный JSON-объект по схеме, без каких-либо пояснений.`;

      const res = await fetch(COMPLETION_URL, {
        method: "POST",
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelUri,
          completionOptions: {
            stream: false,
            temperature: 0.1,
            maxTokens: String(req.maxTokens ?? 8000),
          },
          messages: [
            { role: "system", text: system },
            { role: "user", text: userText },
          ],
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        // 4xx (кроме 429) — ошибка запроса, ретраить бессмысленно.
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`YandexGPT ${res.status}: ${detail.slice(0, 300)}`);
        }
        lastErr = new Error(`YandexGPT ${res.status}: ${detail.slice(0, 200)}`);
        continue;
      }

      const json = (await res.json()) as YandexCompletionResponse;
      const text = json.result?.alternatives?.[0]?.message?.text ?? "";
      const obj = extractJson(text);
      if (obj) {
        const parsed = req.schema.safeParse(obj);
        if (parsed.success) {
          const u = json.result?.usage;
          return {
            data: parsed.data as T,
            model,
            usage: {
              inputTokens: toNum(u?.inputTextTokens),
              outputTokens: toNum(u?.completionTokens),
            },
          };
        }
        lastErr = new AiValidationError(
          `YandexGPT: ответ не прошёл валидацию схемы (попытка ${attempt + 1})`
        );
      } else {
        lastErr = new AiValidationError(
          `YandexGPT: не удалось извлечь JSON из ответа (попытка ${attempt + 1})`
        );
      }
    }

    throw lastErr instanceof Error
      ? lastErr
      : new AiValidationError("YandexGPT: не удалось получить валидный ответ");
  }
}
