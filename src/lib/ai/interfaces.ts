import "server-only";

import type * as z from "zod/v4";

/**
 * Провайдер-абстракция LLM (dependency inversion, §44 ТЗ).
 * Claude можно заменить без переписывания системы. Никакой бизнес-логики здесь —
 * только «дай структурированный ответ по схеме» и «дай текст».
 */

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
}

export interface StructuredResult<T> {
  data: T;
  model: string;
  usage: AiUsage;
}

export interface StructuredRequest<T> {
  /** Zod-схема ожидаемого ответа. Ответ валидируется по ней. */
  schema: z.ZodType<T>;
  system: string;
  user: string;
  /** Переопределить модель (иначе — модель по умолчанию провайдера). */
  model?: string;
  maxTokens?: number;
  /** Кэшировать системный промпт (стабильный префикс). */
  cacheSystem?: boolean;
}

export interface AiProvider {
  readonly name: string;
  readonly defaultModel: string;

  /** Структурированный вызов с валидацией по Zod-схеме. */
  generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResult<T>>;
}

/** Провайдер недоступен/не настроен (нет ключа) — отличаем от ошибки самой модели. */
export class AiProviderNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderNotConfiguredError";
  }
}

/** Модель вернула невалидный по схеме результат после ретраев (§46 ТЗ: FAILED). */
export class AiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiValidationError";
  }
}
