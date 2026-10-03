import "server-only";

import { PublishError, type PublishInput, type PublishOutput, type PublishingProvider } from "@/lib/publishing/interfaces";

/**
 * Публикация в Telegram-канал через Bot API.
 *
 * credentials:
 *   botToken — токен бота от @BotFather
 *   chatId   — @username канала (бот должен быть админом) либо числовой id
 *
 * Без parse_mode намеренно: content_items.body — обычный текст/markdown
 * (см. database.md §1), не HTML. Telegram в режиме parse_mode=HTML требует
 * валидный, сбалансированный HTML — произвольный текст его легко ломает
 * (один "<" или "&" без экранирования — вся публикация падает). Пока нет
 * конвертера markdown→Telegram-entities, безопаснее слать как есть, без
 * форматирования, чем ронять публикацию на каждом втором символе.
 */

interface TgResponse {
  ok: boolean;
  result?: { message_id: number };
  description?: string;
  error_code?: number;
}

async function tgCall(botToken: string, method: string, body: Record<string, unknown>): Promise<TgResponse> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as TgResponse;
  if (!json.ok) {
    const retryable = json.error_code === 429 || (json.error_code ?? 0) >= 500;
    throw new PublishError(`Telegram ${method}: ${json.description ?? "неизвестная ошибка"}`, retryable);
  }
  return json;
}

export const telegramProvider: PublishingProvider = {
  channel: "telegram",

  async publish(input: PublishInput, credentials: Record<string, string>): Promise<PublishOutput> {
    const botToken = credentials.botToken;
    const chatId = credentials.chatId;
    if (!botToken || !chatId) {
      throw new PublishError("Для Telegram не настроены botToken/chatId (вкладка «Каналы»)");
    }

    let resp: TgResponse;
    const firstImage = input.imageUrls?.[0];
    if (firstImage) {
      // Подпись к фото в Telegram ограничена 1024 символами.
      const fitsCaption = input.text.length <= 1024;
      resp = await tgCall(botToken, "sendPhoto", {
        chat_id: chatId,
        photo: firstImage,
        caption: fitsCaption ? input.text : undefined,
      });
      if (!fitsCaption) {
        await tgCall(botToken, "sendMessage", { chat_id: chatId, text: input.text });
      }
    } else {
      resp = await tgCall(botToken, "sendMessage", { chat_id: chatId, text: input.text });
    }

    const messageId = resp.result?.message_id;
    if (messageId == null) throw new PublishError("Telegram: пустой message_id в ответе");

    const handle = chatId.startsWith("@") ? chatId.slice(1) : null;
    return {
      externalId: String(messageId),
      url: handle ? `https://t.me/${handle}/${messageId}` : null,
    };
  },
};
