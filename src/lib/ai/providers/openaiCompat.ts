import "server-only";

import {
  AiProviderNotConfiguredError,
  AiValidationError,
  type AiProvider,
  type StructuredRequest,
  type StructuredResult,
} from "@/lib/ai/interfaces";

/**
 * Провайдер для своего сервера с OpenAI-совместимым API
 * (llama.cpp llama-server, vLLM, TGI, Ollama /v1 и т.п.).
 * Подходит к любой локальной модели — Ternary-Bonsai, Qwen, T-pro и др.
 *
 * ENV:
 *   SELFHOSTED_LLM_URL   — базовый URL до /v1, напр. http://ai-llm:8080/v1
 *                          (или SELFHOSTED_LLM_BASE_URL)
 *   SELFHOSTED_LLM_MODEL — имя модели (llama-server может игнорировать; по умолч. "local")
 *   SELFHOSTED_LLM_API_KEY — опциональный ключ (Authorization: Bearer <...>)
 *
 * Структурированного вывода как у Claude тут нет: просим строгий JSON,
 * достаём JSON из ответа, валидируем Zod-схемой, при провале — ретрай.
 */

interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

/** Убрать блоки рассуждений thinking-моделей и markdown-ограждения, достать {...}. */
function extractJson(text: string): unknown | null {
  let t = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "").trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

export class OpenAiCompatProvider implements AiProvider {
  readonly name = "selfhosted";
  readonly defaultModel: string;

  constructor(opts?: { defaultModel?: string }) {
    this.defaultModel =
      opts?.defaultModel || process.env.SELFHOSTED_LLM_MODEL?.trim() || "local";
  }

  private cfg() {
    const base = (
      process.env.SELFHOSTED_LLM_URL?.trim() ||
      process.env.SELFHOSTED_LLM_BASE_URL?.trim() ||
      ""
    ).replace(/\/+$/, "");
    if (!base) {
      throw new AiProviderNotConfiguredError(
        "Свой LLM-сервер не настроен: задайте SELFHOSTED_LLM_URL (например http://ai-llm:8080/v1)"
      );
    }
    return { endpoint: `${base}/chat/completions`, apiKey: process.env.SELFHOSTED_LLM_API_KEY?.trim() };
  }

  async generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResult<T>> {
    const { endpoint, apiKey } = this.cfg();
    const model = req.model || this.defaultModel;

    const system =
      req.system +
      "\n\nВЕРНИ ОТВЕТ СТРОГО как один валидный JSON-объект требуемой структуры. " +
      "Без markdown, без рассуждений, без текста до или после JSON.";

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      const userText =
        attempt === 0
          ? req.user
          : `${req.user}\n\nПРЕДЫДУЩИЙ ОТВЕТ БЫЛ НЕВАЛИДНЫМ JSON. Верни СТРОГО валидный JSON-объект по схеме, без пояснений.`;

      let res: Response;
      try {
        res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            temperature: 0.1,
            max_tokens: req.maxTokens ?? 8000,
            stream: false,
            messages: [
              { role: "system", content: system },
              { role: "user", content: userText },
            ],
          }),
        });
      } catch (e) {
        lastErr = new Error(`Свой LLM-сервер недоступен: ${(e as Error).message}`);
        continue;
      }

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`Свой LLM ${res.status}: ${detail.slice(0, 300)}`);
        }
        lastErr = new Error(`Свой LLM ${res.status}: ${detail.slice(0, 200)}`);
        continue;
      }

      const json = (await res.json()) as OpenAiChatResponse;
      const text = json.choices?.[0]?.message?.content ?? "";
      const obj = extractJson(text);
      if (obj) {
        const parsed = req.schema.safeParse(obj);
        if (parsed.success) {
          return {
            data: parsed.data as T,
            model,
            usage: {
              inputTokens: json.usage?.prompt_tokens ?? 0,
              outputTokens: json.usage?.completion_tokens ?? 0,
            },
          };
        }
        lastErr = new AiValidationError(
          `Свой LLM: ответ не прошёл валидацию схемы (попытка ${attempt + 1})`
        );
      } else {
        lastErr = new AiValidationError(
          `Свой LLM: не удалось извлечь JSON из ответа (попытка ${attempt + 1})`
        );
      }
    }

    throw lastErr instanceof Error
      ? lastErr
      : new AiValidationError("Свой LLM: не удалось получить валидный ответ");
  }
}
