import "server-only";

import { loadPrompt } from "@/lib/ai/promptFiles";
import type { ContentBrandDocument, ContentChannelProfile, ContentOsChannel } from "@/lib/contentOsTypes";

/**
 * Простая версия Brand RAG (database.md §5): пока корпус небольшой, просто
 * подмешиваем активные бренд-документы целиком, без поиска релевантных
 * чанков по эмбеддингам. Переходить на настоящий поиск, когда корпус
 * вырастет настолько, что это станет заметно дороже по токенам.
 */
function brandContext(brandDocs: ContentBrandDocument[]): string {
  if (!brandDocs.length) return "База знаний о бренде пока не заполнена — пиши нейтрально-деловым тоном.";
  return brandDocs.map((d) => `### ${d.title}\n${d.content}`).join("\n\n");
}

/* ─────────── Writer (базовая статья, prompts/writer.md) ─────────── */

export function buildWriterSystemPrompt(brandDocs: ContentBrandDocument[]): string {
  const { system } = loadPrompt("writer");
  return `${system}\n\nБаза знаний о бренде:\n${brandContext(brandDocs)}`;
}

export function buildWriterUserPrompt(input: {
  topicTitle: string; thesis?: string; audience: string; angle: string; requirements?: string; researchSummary?: string;
}): string {
  return [
    `Тема: ${input.topicTitle}`,
    input.thesis ? `Тезисы/факты: ${input.thesis}` : "",
    input.researchSummary ? `Research pack:\n${input.researchSummary}` : "",
    `Целевая аудитория: ${input.audience}`,
    input.angle ? `Ракурс подачи: ${input.angle}` : "",
    input.requirements ? `Дополнительные требования: ${input.requirements}` : "",
  ].filter(Boolean).join("\n");
}

/* ─────────── Channel adaptation (prompts/<channel>.md) ─────────── */

const CHANNEL_PROMPT_FILE: Record<ContentOsChannel, string> = {
  article: "writer", // статья — сама базовая версия, отдельного файла адаптации не требует
  telegram: "telegram",
  vk: "vk",
  dzen: "dzen",
  max: "max",
};

export function buildChannelSystemPrompt(channel: ContentChannelProfile, brandDocs: ContentBrandDocument[]): string {
  const { system } = loadPrompt(CHANNEL_PROMPT_FILE[channel.id]);
  const emojiPolicy = channel.emoji_level === 0 ? "без эмодзи"
    : channel.emoji_level === 1 ? "минимум эмодзи" : channel.emoji_level === 2 ? "умеренно эмодзи" : "активно эмодзи";
  const hashtagPolicy = channel.hashtags ? `${channel.hashtag_count || 3} хэштегов в конце` : "без хэштегов";

  return [
    system,
    "",
    `Настройки площадки (могут быть изменены в админке, следуй им): лимит ${channel.char_limit} символов, эмодзи — ${emojiPolicy}, хэштеги — ${hashtagPolicy}${channel.cta ? `, призыв к действию в духе «${channel.cta}»` : ""}.`,
    channel.ai_prompt ? `Дополнительно: ${channel.ai_prompt}` : "",
    "",
    "База знаний о бренде:",
    brandContext(brandDocs),
  ].filter(Boolean).join("\n");
}

export function buildChannelUserPrompt(input: {
  topicTitle: string; thesis?: string; audience: string; angle: string; requirements?: string; baseArticleBody?: string;
}): string {
  return [
    input.baseArticleBody
      ? `Исходный материал (базовая версия для адаптации):\n${input.baseArticleBody}`
      : `Тема: ${input.topicTitle}${input.thesis ? `\nТезисы: ${input.thesis}` : ""}`,
    `Целевая аудитория: ${input.audience}`,
    input.angle ? `Ракурс подачи: ${input.angle}` : "",
    input.requirements ? `Дополнительные требования: ${input.requirements}` : "",
  ].filter(Boolean).join("\n");
}

/* ─────────── QC: brand / seo / fact (prompts/*-check.md) ─────────── */

export function buildQcPrompt(kind: "brand" | "seo" | "fact", opts: { brandDocs?: ContentBrandDocument[] }): string {
  const fileName = kind === "brand" ? "brand-check" : kind === "seo" ? "seo-check" : "fact-check";
  const { system } = loadPrompt(fileName);
  if (kind === "brand") return `${system}\n\nБаза знаний о бренде:\n${brandContext(opts.brandDocs ?? [])}`;
  return system;
}

export function buildQcUserPrompt(kind: "brand" | "seo" | "fact", text: string, researchSummary?: string): string {
  if (kind === "fact") {
    return [`Текст на проверку:\n${text}`, researchSummary ? `Research pack (первоисточники):\n${researchSummary}` : "Research pack не предоставлен — оцени по наличию непроверяемых конкретных утверждений."].join("\n\n");
  }
  return `Текст на проверку:\n${text}`;
}

/* ─────────── Research synthesis (prompts/research.md) ─────────── */

export function buildResearchSystemPrompt(): string {
  return loadPrompt("research").system;
}

export function buildResearchUserPrompt(sources: { title: string; text: string }[]): string {
  return sources.map((s, i) => `Источник ${i + 1}: ${s.title}\n${s.text}`).join("\n\n");
}

/* ─────────── Topic analysis (prompts/topic-analysis.md) ─────────── */

export function buildTopicAnalysisSystemPrompt(): string {
  return loadPrompt("topic-analysis").system;
}

export function buildTopicAnalysisUserPrompt(title: string, thesis?: string): string {
  return `Заголовок: ${title}${thesis ? `\nТезисы: ${thesis}` : ""}`;
}
