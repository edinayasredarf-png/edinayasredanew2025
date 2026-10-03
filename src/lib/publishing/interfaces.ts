import "server-only";

/**
 * Провайдер-абстракция публикации в канал (по аналогии с AiProvider,
 * src/lib/ai/interfaces.ts) — чтобы VK/Telegram/будущие каналы подключались
 * одинаково, без завязки оркестрации на конкретный API.
 */

export interface PublishInput {
  text: string;
  /** Абсолютные URL картинок (если есть) — провайдер сам решает, как прикрепить. */
  imageUrls?: string[];
}

export interface PublishOutput {
  externalId: string;
  url: string | null;
}

/** retryable=true — временная проблема (рейт-лимит, 5xx), стоит повторить позже. */
export class PublishError extends Error {
  retryable: boolean;
  constructor(message: string, retryable = false) {
    super(message);
    this.name = "PublishError";
    this.retryable = retryable;
  }
}

export interface PublishingProvider {
  readonly channel: "vk" | "telegram";
  publish(input: PublishInput, credentials: Record<string, string>): Promise<PublishOutput>;
}
