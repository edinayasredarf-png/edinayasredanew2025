import "server-only";

import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { YandexGptProvider } from "@/lib/ai/providers/yandexgpt";
import type { AiProvider } from "@/lib/ai/interfaces";

export * from "@/lib/ai/interfaces";

/**
 * Фабрика AI-провайдера (§44 ТЗ: dependency inversion).
 *   AI_PROVIDER = anthropic (Claude) | yandex (YandexGPT)
 * По умолчанию — anthropic. Для YandexGPT: AI_PROVIDER=yandex (переиспользует
 * ключи SpeechKit). Провайдер меняется одной переменной без переписывания системы.
 */
let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;
  const provider = (process.env.AI_PROVIDER || "anthropic").trim();
  switch (provider) {
    case "yandex":
    case "yandexgpt":
      cached = new YandexGptProvider();
      return cached;
    case "anthropic":
    default:
      cached = new AnthropicProvider({
        defaultModel: process.env.AI_MODEL_ANALYSIS?.trim() || undefined,
      });
      return cached;
  }
}
