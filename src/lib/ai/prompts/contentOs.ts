import "server-only";

import type { ContentBrandDocument, ContentChannelProfile } from "@/lib/contentOsTypes";

export interface ContentOsDraftInput {
  topicTitle: string;
  thesis?: string;
  audience: string;
  angle: string;
  requirements?: string;
}

/**
 * Простая версия Brand RAG (database.md §5): пока корпус небольшой, просто
 * подмешиваем активные бренд-документы целиком, без поиска релевантных
 * чанков по эмбеддингам. Переходить на настоящий поиск, когда корпус
 * вырастет настолько, что это станет заметно дороже по токенам (не раньше).
 */
export function buildContentOsSystemPrompt(channel: ContentChannelProfile, brandDocs: ContentBrandDocument[]): string {
  const emojiPolicy = channel.emoji_level === 0 ? "без эмодзи"
    : channel.emoji_level === 1 ? "минимум эмодзи" : channel.emoji_level === 2 ? "умеренно эмодзи" : "активно эмодзи";
  const hashtagPolicy = channel.hashtags
    ? `${channel.hashtag_count || 3} хэштегов в конце`
    : "без хэштегов";

  const brandContext = brandDocs.length
    ? brandDocs.map((d) => `### ${d.title}\n${d.content}`).join("\n\n")
    : "Правила бренда пока не заполнены в базе знаний — пиши нейтрально-деловым тоном.";

  return [
    `Ты — контент-стратег и копирайтер команды маркетинга.`,
    ``,
    `База знаний о бренде:`,
    brandContext,
    ``,
    `Пиши под канал «${channel.name}»:`,
    `— лимит длины: ${channel.char_limit} символов (не превышать);`,
    `— формальность тона: ${channel.formality}/100 (0 — неформально, 100 — официально);`,
    `— эмодзи: ${emojiPolicy};`,
    `— хэштеги: ${hashtagPolicy};`,
    channel.cta ? `— в конце уместен призыв к действию в духе: «${channel.cta}»;` : "",
    channel.ai_prompt ? `— особые правила площадки: ${channel.ai_prompt}` : "",
    ``,
    `Пиши по-русски, фактологично, без выдуманных цифр и цитат.`,
    `Верни заголовок и текст публикации — без markdown-разметки, без пояснений от себя.`,
  ].filter(Boolean).join("\n");
}

export function buildContentOsUserPrompt(input: ContentOsDraftInput): string {
  return [
    `Тема: ${input.topicTitle}`,
    input.thesis ? `Тезисы/факты: ${input.thesis}` : "",
    `Целевая аудитория: ${input.audience}`,
    input.angle ? `Ракурс подачи: ${input.angle}` : "",
    input.requirements ? `Дополнительные требования: ${input.requirements}` : "",
  ].filter(Boolean).join("\n");
}
