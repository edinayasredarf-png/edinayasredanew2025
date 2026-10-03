// Content OS — общие типы. Без server-only: клиент (админ-UI) и сервер (БД).
// Схема — docs/content-os/database.md, разделы админки — ТЗ §14.

/* ─────────── Компании/бренды (§10 database.md, добавлено 2026-10-03) ─────────── */

/** id первой/дефолтной компании — на неё переносится всё, что было до мультикомпанийности. */
export const DEFAULT_COMPANY_ID = "edinaya-sreda";

export interface ContentCompany {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export type ContentOsChannel = "article" | "telegram" | "vk" | "dzen" | "max";
export const CONTENT_OS_CHANNELS: { key: ContentOsChannel; label: string; icon: string }[] = [
  { key: "article", label: "Сайт / Статья", icon: "🌐" },
  { key: "telegram", label: "Telegram", icon: "✈️" },
  { key: "vk", label: "ВКонтакте", icon: "🔵" },
  { key: "dzen", label: "Яндекс Дзен", icon: "📖" },
  { key: "max", label: "MAX", icon: "💬" },
];
export const SOCIAL_CHANNELS: ContentOsChannel[] = ["telegram", "vk", "dzen", "max"];

export type ContentClusterStatus = "new" | "briefed" | "in_production" | "review" | "done" | "archived";
export const CONTENT_CLUSTER_STATUSES: { key: ContentClusterStatus; label: string }[] = [
  { key: "new", label: "Новый" },
  { key: "briefed", label: "Есть бриф" },
  { key: "in_production", label: "В работе" },
  { key: "review", label: "На проверке" },
  { key: "done", label: "Готово" },
  { key: "archived", label: "В архиве" },
];

/* ─────────── Ideas (темы) ─────────── */

export interface ContentTopic {
  id: string;
  title: string;
  source_id: string | null;
  /** @deprecated наследие интеграции с «Новостным радаром», больше не пишется новым кодом — см. source_item_id. */
  radar_item_id: string | null;
  /** Откуда пришла тема — элемент собственной ленты Content OS (content_source_items), если не создана вручную. */
  source_item_id: string | null;
  thesis: string;
  relevance: number;
  popularity: number;
  score: number | null;
  status: "new" | "clustered" | "briefed" | "done" | "dismissed";
  created_by: string | null;
  created_at: number;
  updated_at: number;
}

/* ─────────── Sources (§19 ТЗ) ─────────── */

export type ContentSourceType = "rss" | "telegram" | "keyword" | "website";
export const CONTENT_SOURCE_TYPES: { key: ContentSourceType; label: string }[] = [
  { key: "keyword", label: "Ключевые слова (Google News)" },
  { key: "rss", label: "RSS-лента" },
  { key: "telegram", label: "Telegram-канал" },
  { key: "website", label: "Сайт / парсинг" },
];

export interface ContentSource {
  id: string;
  name: string;
  type: ContentSourceType;
  url: string;
  external_id: string | null;
  priority: number; // 1-10, вес доверия
  active: boolean;
  poll_interval: number; // минуты
  categories: string[];
  tags: string[];
  last_polled_at: number | null;
  created_at: number;
}

/** Новость/пост, собранные опросом источника — своя лента Content OS, без «Новостного радара». */
export type ContentSourceItemStatus = "new" | "used" | "dismissed";

export interface ContentSourceItem {
  id: string;
  source_id: string;
  source_name: string;
  category: string;
  title: string;
  link: string;
  snippet: string;
  published_at: number;
  status: ContentSourceItemStatus;
  created_at: number;
}

/* ─────────── Content Cluster / Brief ─────────── */

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

/* ─────────── Content Item ─────────── */

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
  scheduled_at: number | null;
  approved_by: string | null;
  approved_at: number | null;
  created_at: number;
  updated_at: number;
}

/** Айтем + заголовок кластера — для списковых экранов (Articles/Social/Content Plan). */
export interface ContentItemWithCluster extends ContentItem {
  cluster_title: string;
}

export interface ContentItemVersion {
  id: string;
  content_item_id: string;
  body: string;
  edited_by: string | null;
  note: string;
  created_at: number;
}

/* ─────────── QC-пайплайн (§27 ТЗ: Brand → SEO → Fact) ─────────── */

export type QcCheckType = "brand" | "seo" | "fact";
export type QcCheckStatus = "pass" | "review" | "fail";
export const QC_CHECK_LABELS: Record<QcCheckType, string> = { brand: "Бренд", seo: "SEO", fact: "Факты" };

export interface ContentQcCheck {
  id: string;
  content_item_id: string;
  check_type: QcCheckType;
  status: QcCheckStatus;
  notes: string;
  created_at: number;
}

/* ─────────── SEO Engine (§23 ТЗ) ─────────── */

export interface ContentSeo {
  content_item_id: string;
  intent: string;
  primary_keyword: string;
  secondary_keywords: string[];
  meta_title: string;
  meta_description: string;
  h1: string;
  faq: { question: string; answer: string }[];
  internal_links: string[];
  slug: string;
  updated_at: number;
}

/* ─────────── Research Engine (§22 ТЗ) ─────────── */

export interface ContentResearchPack {
  id: string;
  cluster_id: string;
  summary: string;
  created_at: number;
}

export interface ContentResearchSource {
  id: string;
  pack_id: string;
  url: string;
  title: string;
  extracted_text: string;
  verified: boolean;
  created_at: number;
}

export interface ContentFactCheck {
  id: string;
  content_item_id: string;
  claim: string;
  verdict: "verified" | "unverified" | "false";
  source_url: string;
  checked_at: number;
}

/* ─────────── Publications (§29 ТЗ) ─────────── */

export type PublicationStatus = "pending" | "scheduled" | "published" | "failed";
export const PUBLICATION_STATUSES: { key: PublicationStatus; label: string }[] = [
  { key: "pending", label: "Ожидает" },
  { key: "scheduled", label: "Запланировано" },
  { key: "published", label: "Опубликовано" },
  { key: "failed", label: "Ошибка" },
];

export interface ContentPublication {
  id: string;
  content_item_id: string;
  channel: ContentOsChannel;
  external_id: string | null;
  url: string | null;
  status: PublicationStatus;
  scheduled_at: number | null;
  published_at: number | null;
  error: string | null;
  retry_count: number;
  created_at: number;
  updated_at: number;
}

/* ─────────── Channel Profiles (Settings) ─────────── */

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
  /**
   * Токены/id для реальной публикации (пока только vk/telegram, см.
   * src/lib/publishing). Хранится как есть в БД (не зашифровано) — доступ
   * защищён только requireAdminAccess, как и остальные данные Content OS.
   *   vk: { groupId, accessToken }
   *   telegram: { chatId, botToken }
   */
  credentials?: Record<string, string>;
}

export const DEFAULT_CHANNEL_PROFILES: ContentChannelProfile[] = [
  { id: "article", name: "Сайт / Статья", status: "connected", char_limit: 100000, formality: 75, emoji_level: 0, hashtags: false, hashtag_count: 0, cta: "Свяжитесь с нами", ai_prompt: "SEO-статья. Ключевые слова органично в тексте. Структура: заголовок → вступление → подзаголовки → заключение. Без эмодзи.", qa_notes: "", sort_order: 1 },
  { id: "telegram", name: "Telegram", status: "setup", char_limit: 4096, formality: 30, emoji_level: 2, hashtags: false, hashtag_count: 0, cta: "Пишите нам: @edinaya_sreda", ai_prompt: "Лаконичный деловой стиль, абзацы разделены пустой строкой, умеренные эмодзи, без хэштегов.", qa_notes: "", sort_order: 2 },
  { id: "vk", name: "ВКонтакте", status: "setup", char_limit: 16000, formality: 50, emoji_level: 2, hashtags: true, hashtag_count: 5, cta: "Подписывайтесь на нашу страницу", ai_prompt: "Деловой, но дружелюбный тон. Заголовок → суть → детали → призыв. 3-5 хэштегов в конце.", qa_notes: "", sort_order: 3 },
  { id: "dzen", name: "Яндекс Дзен", status: "setup", char_limit: 50000, formality: 70, emoji_level: 0, hashtags: false, hashtag_count: 0, cta: "Подпишитесь на канал", ai_prompt: "Экспертная статья с подзаголовками. Без эмодзи. 1500-3000 слов. SEO-заголовок.", qa_notes: "", sort_order: 4 },
  { id: "max", name: "MAX", status: "planned", char_limit: 4096, formality: 40, emoji_level: 2, hashtags: false, hashtag_count: 0, cta: "Напишите нам в MAX", ai_prompt: "Аналогично Telegram.", qa_notes: "", sort_order: 5 },
];

/* ─────────── Brand Knowledge Base ─────────── */

export interface ContentBrandDocument {
  id: string;
  title: string;
  category: "brand" | "products" | "company" | "editorial" | "seo" | "research" | "legal" | "brand-quick-rules";
  content: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

/* ─────────── AI Gateway / промпты (§33-35 ТЗ) ─────────── */

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

export const CONTENT_OS_TASK_LABELS: Record<ContentOsTask, string> = {
  topic_classification: "Классификация темы",
  duplicate_detection: "Поиск дублей",
  brand_check: "Проверка бренда",
  first_draft: "Черновик",
  channel_adaptation: "Адаптация под канал",
  research_synthesis: "Синтез research",
  final_editorial: "Финальная редактура",
  seo_check: "SEO-проверка",
  fact_check: "Факт-чек",
};

export interface ContentPromptVersion {
  task: ContentOsTask;
  version: number;
  file_path: string;
  updated_at: number;
}

export interface ContentAiRun {
  id: string;
  task: ContentOsTask;
  prompt_version: number | null;
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
