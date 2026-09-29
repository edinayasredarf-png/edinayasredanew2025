// Content OS — общие типы. Без server-only: клиент (админ-UI) и сервер (БД).
// Схема — docs/content-os/database.md. Первый срез: без SEO/fact-check/
// publications/analytics (Phase 2b, отдельно).

export type ContentOsChannel = "article" | "telegram" | "vk" | "dzen" | "max";
export const CONTENT_OS_CHANNELS: { key: ContentOsChannel; label: string; icon: string }[] = [
  { key: "article", label: "Сайт / Статья", icon: "🌐" },
  { key: "telegram", label: "Telegram", icon: "✈️" },
  { key: "vk", label: "ВКонтакте", icon: "🔵" },
  { key: "dzen", label: "Яндекс Дзен", icon: "📖" },
  { key: "max", label: "MAX", icon: "💬" },
];

export type ContentClusterStatus = "new" | "briefed" | "in_production" | "review" | "done" | "archived";
export const CONTENT_CLUSTER_STATUSES: { key: ContentClusterStatus; label: string }[] = [
  { key: "new", label: "Новый" },
  { key: "briefed", label: "Есть бриф" },
  { key: "in_production", label: "В работе" },
  { key: "review", label: "На проверке" },
  { key: "done", label: "Готово" },
  { key: "archived", label: "В архиве" },
];

export interface ContentTopic {
  id: string;
  title: string;
  radar_item_id: string | null;
  thesis: string;
  relevance: number;
  popularity: number;
  score: number | null;
  status: "new" | "clustered" | "briefed" | "done" | "dismissed";
  created_by: string | null;
  created_at: number;
  updated_at: number;
}

export interface ContentCluster {
  id: string;
  title: string;
  primary_topic_id: string | null;
  status: ContentClusterStatus;
  created_by: string | null;
  created_at: number;
  updated_at: number;
}

export interface ContentBrief {
  id: string;
  cluster_id: string;
  audience: string;
  angle: string;
  requirements: string;
  channels: ContentOsChannel[];
  created_by: string | null;
  created_at: number;
}

export type ContentItemStatus = "draft" | "review" | "approved" | "scheduled" | "published" | "failed";
export const CONTENT_ITEM_STATUSES: { key: ContentItemStatus; label: string }[] = [
  { key: "draft", label: "Черновик" },
  { key: "review", label: "На проверке" },
  { key: "approved", label: "Утверждено" },
  { key: "scheduled", label: "Запланировано" },
  { key: "published", label: "Опубликовано" },
  { key: "failed", label: "Ошибка" },
];

export interface ContentItem {
  id: string;
  cluster_id: string;
  channel: ContentOsChannel;
  status: ContentItemStatus;
  title: string;
  body: string;
  meta: Record<string, unknown>;
  approved_by: string | null;
  approved_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface ContentItemVersion {
  id: string;
  content_item_id: string;
  body: string;
  edited_by: string | null;
  note: string;
  created_at: number;
}

export type ChannelProfileStatus = "connected" | "setup" | "manual" | "planned";
export const CHANNEL_PROFILE_STATUSES: { key: ChannelProfileStatus; label: string }[] = [
  { key: "connected", label: "Подключён" },
  { key: "setup", label: "Настройка" },
  { key: "manual", label: "Вручную" },
  { key: "planned", label: "Запланирован" },
];

export interface ContentChannelProfile {
  id: ContentOsChannel;
  name: string;
  status: ChannelProfileStatus;
  char_limit: number;
  formality: number;
  emoji_level: number;
  hashtags: boolean;
  hashtag_count: number;
  cta: string;
  ai_prompt: string;
  qa_notes: string;
  sort_order: number;
}

export const DEFAULT_CHANNEL_PROFILES: ContentChannelProfile[] = [
  { id: "article", name: "Сайт / Статья", status: "connected", char_limit: 100000, formality: 75, emoji_level: 0, hashtags: false, hashtag_count: 0, cta: "Свяжитесь с нами", ai_prompt: "SEO-статья. Ключевые слова органично в тексте. Структура: заголовок → вступление → подзаголовки → заключение. Без эмодзи.", qa_notes: "", sort_order: 1 },
  { id: "telegram", name: "Telegram", status: "setup", char_limit: 4096, formality: 30, emoji_level: 2, hashtags: false, hashtag_count: 0, cta: "Пишите нам: @edinaya_sreda", ai_prompt: "Лаконичный деловой стиль, абзацы разделены пустой строкой, умеренные эмодзи, без хэштегов.", qa_notes: "", sort_order: 2 },
  { id: "vk", name: "ВКонтакте", status: "setup", char_limit: 16000, formality: 50, emoji_level: 2, hashtags: true, hashtag_count: 5, cta: "Подписывайтесь на нашу страницу", ai_prompt: "Деловой, но дружелюбный тон. Заголовок → суть → детали → призыв. 3-5 хэштегов в конце.", qa_notes: "", sort_order: 3 },
  { id: "dzen", name: "Яндекс Дзен", status: "setup", char_limit: 50000, formality: 70, emoji_level: 0, hashtags: false, hashtag_count: 0, cta: "Подпишитесь на канал", ai_prompt: "Экспертная статья с подзаголовками. Без эмодзи. 1500-3000 слов. SEO-заголовок.", qa_notes: "", sort_order: 4 },
  { id: "max", name: "MAX", status: "planned", char_limit: 4096, formality: 40, emoji_level: 2, hashtags: false, hashtag_count: 0, cta: "Напишите нам в MAX", ai_prompt: "Аналогично Telegram.", qa_notes: "", sort_order: 5 },
];

export interface ContentBrandDocument {
  id: string;
  title: string;
  category: "brand" | "products" | "company" | "editorial" | "seo" | "research" | "legal" | "brand-quick-rules";
  content: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export type ContentOsTask =
  | "topic_classification"
  | "duplicate_detection"
  | "brand_check"
  | "first_draft"
  | "channel_adaptation"
  | "research_synthesis"
  | "final_editorial"
  | "seo_check"
  | "fact_check";

export interface ContentAiRun {
  id: string;
  task: ContentOsTask;
  provider: "local" | "anthropic";
  model: string;
  content_item_id: string | null;
  data_classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL";
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  cost: number | null;
  status: "ok" | "error" | "fallback";
  error: string | null;
  created_at: number;
}
