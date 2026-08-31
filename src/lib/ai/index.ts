import "server-only";

import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import type { AiProvider } from "@/lib/ai/interfaces";

export * from "@/lib/ai/interfaces";

/**
 * Фабрика AI-провайдера (§44 ТЗ: dependency inversion).
 * По умолчанию — Anthropic. Провайдер и модель со временем будут читаться из
 * es_app.ai_settings; пока — из env с безопасными дефолтами.
 */
let cached: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (cached) return cached;
  const provider = (process.env.AI_PROVIDER || "anthropic").trim();
  switch (provider) {
    case "anthropic":
    default:
      cached = new AnthropicProvider({
        defaultModel: process.env.AI_MODEL_ANALYSIS?.trim() || undefined,
      });
      return cached;
  }
}
