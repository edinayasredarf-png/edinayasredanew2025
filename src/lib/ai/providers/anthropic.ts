import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  AiProviderNotConfiguredError,
  AiValidationError,
  type AiProvider,
  type StructuredRequest,
  type StructuredResult,
} from "@/lib/ai/interfaces";

/**
 * Провайдер Claude (Anthropic). Единственное место, знающее про SDK Anthropic.
 * Структурированный вывод — через client.messages.parse + zodOutputFormat,
 * что гарантирует валидацию по Zod-схеме (§46 ТЗ).
 */

const DEFAULT_MODEL = "claude-opus-5";

export class AnthropicProvider implements AiProvider {
  readonly name = "anthropic";
  readonly defaultModel: string;
  private client: Anthropic | null = null;

  constructor(opts?: { defaultModel?: string }) {
    this.defaultModel = opts?.defaultModel || DEFAULT_MODEL;
  }

  private getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      throw new AiProviderNotConfiguredError(
        "ANTHROPIC_API_KEY не задан — Claude недоступен"
      );
    }
    if (!this.client) this.client = new Anthropic();
    return this.client;
  }

  async generateStructured<T>(
    req: StructuredRequest<T>
  ): Promise<StructuredResult<T>> {
    const client = this.getClient();
    const model = req.model || this.defaultModel;

    const system = req.cacheSystem
      ? [
          {
            type: "text" as const,
            text: req.system,
            cache_control: { type: "ephemeral" as const },
          },
        ]
      : req.system;

    let lastErr: unknown;
    // Ретрай при невалидном ответе (§46: retry → repair → fallback → FAILED).
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await client.messages.parse({
        model,
        max_tokens: req.maxTokens ?? 16000,
        thinking: { type: "adaptive" },
        system,
        messages: [{ role: "user", content: req.user }],
        output_config: { format: zodOutputFormat(req.schema) },
      });

      if (response.parsed_output) {
        return {
          data: response.parsed_output as T,
          model,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
          },
        };
      }
      lastErr = new AiValidationError(
        `Ответ модели не прошёл валидацию по схеме (попытка ${attempt + 1})`
      );
    }
    throw lastErr instanceof Error
      ? lastErr
      : new AiValidationError("Не удалось получить валидный ответ модели");
  }
}
