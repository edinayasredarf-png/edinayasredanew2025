import "server-only";

import type { CfBrandSettings, CfPlatform } from "@/lib/contentFactoryTypes";

export interface ContentFactoryGenInput {
  topicTitle: string;
  thesis?: string;
  sourceName?: string;
  sourceUrl?: string;
  useSource: boolean;
  type: "post" | "article" | "reel" | "digest";
  audience: string;
  requirements?: string;
  emoji: "auto" | "0" | "1" | "2" | "3";
}

const TYPE_LABEL: Record<ContentFactoryGenInput["type"], string> = {
  post: "короткий пост",
  article: "статья",
  reel: "сценарий короткого видео (рилс)",
  digest: "дайджест новостей",
};

export function buildContentFactorySystemPrompt(platform: CfPlatform, brand: CfBrandSettings): string {
  const emojiPolicy = platform.emoji_level === 0
    ? "без эмодзи"
    : platform.emoji_level === 1 ? "минимум эмодзи" : platform.emoji_level === 2 ? "умеренно эмодзи" : "активно эмодзи";
  const hashtagPolicy = platform.hashtags
    ? `${platform.hashtag_count || 3}–${Math.max(platform.hashtag_count || 3, (platform.hashtag_count || 3) + 2)} хэштегов в конце`
    : "без хэштегов";

  return [
    `Ты — контент-стратег и копирайтер команды маркетинга АИС «Единая среда» (Экострой, Ростов-на-Дону).`,
    `О компании: ${brand.description}`,
    brand.utp ? `Ключевые УТП, которые уместно подчёркивать: ${brand.utp}.` : "",
    brand.avoid ? `Чего избегать в тексте: ${brand.avoid}.` : "",
    brand.forbidden_words ? `Запрещённые слова и обороты — никогда их не использовать: ${brand.forbidden_words}.` : "",
    ``,
    `Пиши текст под платформу «${platform.name}»:`,
    `— лимит длины: ${platform.char_limit} символов (не превышать);`,
    `— формальность тона: ${platform.formality}/100 (0 — максимально неформально, 100 — максимально официально);`,
    `— эмодзи: ${emojiPolicy};`,
    `— хэштеги: ${hashtagPolicy};`,
    platform.cta ? `— в конце уместен призыв к действию в духе: «${platform.cta}»;` : "",
    platform.ai_prompt ? `— особые правила площадки: ${platform.ai_prompt}` : "",
    ``,
    `Пиши по-русски, фактологично, без выдуманных цифр и цитат. Не придумывай факты, которых нет в теме и тезисах.`,
    `Верни только готовый текст публикации (и список хэштегов отдельно, если они уместны) — без пояснений и без markdown-разметки заголовка.`,
  ].filter(Boolean).join("\n");
}

export function buildContentFactoryUserPrompt(input: ContentFactoryGenInput): string {
  const emojiOverride = input.emoji !== "auto"
    ? `Переопредели правило эмодзи площадки: уровень ${input.emoji} (0 — без эмодзи, 3 — активно).`
    : "";
  return [
    `Формат публикации: ${TYPE_LABEL[input.type]}.`,
    `Целевая аудитория: ${input.audience}.`,
    `Тема: ${input.topicTitle}`,
    input.thesis ? `Тезисы/факты, которые нужно отразить: ${input.thesis}` : "",
    input.sourceName || input.sourceUrl ? `Первоисточник: ${[input.sourceName, input.sourceUrl].filter(Boolean).join(" — ")}` : "",
    input.useSource && input.sourceUrl ? `Упомяни и, если уместно, сошлись на первоисточник (${input.sourceUrl}) в тексте.` : "",
    input.requirements ? `Дополнительные требования редактора: ${input.requirements}` : "",
    emojiOverride,
  ].filter(Boolean).join("\n");
}
