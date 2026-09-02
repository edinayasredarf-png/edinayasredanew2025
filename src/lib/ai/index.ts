import "server-only";

import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { YandexGptProvider } from "@/lib/ai/providers/yandexgpt";
import { getAiConfig } from "@/lib/server/aiSales/settingsDb";
import type { AiProvider } from "@/lib/ai/interfaces";

export * from "@/lib/ai/interfaces";

/**
 * Фабрика AI-провайдера (§44 ТЗ: dependency inversion). Провайдер и модель
 * читаются из ai_settings (UI «Настройки AI»), с фолбэком на env. Меняются без
 * перезапуска — на следующем анализе.
 *   ai.provider = anthropic (Claude) | yandex (YandexGPT)
 */
export async function getAiProvider(): Promise<AiProvider> {
  const cfg = await getAiConfig();
  switch (cfg.provider) {
    case "yandex":
    case "yandexgpt":
      return new YandexGptProvider();
    case "anthropic":
    default:
      return new AnthropicProvider({ defaultModel: cfg.analysisModel || undefined });
  }
}
