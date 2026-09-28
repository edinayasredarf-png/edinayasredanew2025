// Контент-завод — общие типы и дефолты. Без server-only: используется и на
// клиенте (админ-UI), и на сервере (БД). Портирует прототип
// «контент-завод-v2.html» на бэкенд сайта (Timeweb Postgres).

export interface CfRubric {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: number;
}

export type CfTopicStatus = 'new' | 'in_progress' | 'planned' | 'published';

export const CF_TOPIC_STATUSES: { key: CfTopicStatus; label: string }[] = [
  { key: 'new', label: 'Новая' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'planned', label: 'В плане' },
  { key: 'published', label: 'Опубликована' },
];

export interface CfTopic {
  id: string;
  title: string;
  rubric_id: string | null;
  source_name: string;
  source_url: string;
  thesis: string;
  relevance: number;
  popularity: number;
  status: CfTopicStatus;
  radar_item_id: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export type CfPlatformStatus = 'connected' | 'setup' | 'manual' | 'planned';

export const CF_PLATFORM_STATUSES: { key: CfPlatformStatus; label: string }[] = [
  { key: 'connected', label: 'Подключена' },
  { key: 'setup', label: 'Настройка' },
  { key: 'manual', label: 'Вручную' },
  { key: 'planned', label: 'Запланирована' },
];

export interface CfPlatform {
  id: string;
  name: string;
  icon: string;
  status: CfPlatformStatus;
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

export type CfPlanType = 'post' | 'article' | 'reel' | 'digest';

export const CF_PLAN_TYPES: { key: CfPlanType; label: string; color: string }[] = [
  { key: 'post', label: 'Пост', color: '#029cda' },
  { key: 'article', label: 'Статья', color: '#22c55e' },
  { key: 'reel', label: 'Рилс', color: '#f59e0b' },
  { key: 'digest', label: 'Дайджест', color: '#a78bfa' },
];

export type CfPlanStatus = 'draft' | 'scheduled' | 'published';

export const CF_PLAN_STATUSES: { key: CfPlanStatus; label: string }[] = [
  { key: 'draft', label: 'Черновик' },
  { key: 'scheduled', label: 'Запланирован' },
  { key: 'published', label: 'Опубликован' },
];

export interface CfPlanItem {
  id: string;
  topic_id: string | null;
  title: string;
  type: CfPlanType;
  scheduled_at: number;
  platforms: string[];
  status: CfPlanStatus;
  created_at: number;
  updated_at: number;
}

export interface CfQaChecklist {
  facts: boolean;
  source: boolean;
  limits: boolean;
  forbidden: boolean;
  approved: boolean;
}

export const EMPTY_QA: CfQaChecklist = { facts: false, source: false, limits: false, forbidden: false, approved: false };

export interface CfPlanVersion {
  id: string;
  plan_id: string;
  platform_id: string;
  body: string;
  qa: CfQaChecklist;
  created_at: number;
  updated_at: number;
}

export interface CfBrandSettings {
  description: string;
  avoid: string;
  utp: string;
  forbidden_words: string;
  updated_at: number;
}

export const DEFAULT_BRAND_SETTINGS: CfBrandSettings = {
  description:
    'АИС «Единая среда» — российская платформа для цифровизации муниципальных объектов: кладбищ, зелёных насаждений и благоустройства. Помогаем администрациям выполнять требования ФЗ-131 и ФЗ-8.',
  avoid:
    'Избегать жаргона, излишней технической терминологии без объяснений, упоминаний конкурентов по имени, политически окрашенных формулировок.',
  utp: 'SLAM-съёмка БПЛА, работа под пологом деревьев, ФЗ-131 обязанности МСУ, российское ПО',
  forbidden_words: 'дешевле конкурентов, гарантируем, лучшие в мире',
  updated_at: 0,
};

/** 8 рубрик по умолчанию — из CLAUDE.md контент-завода. */
export const DEFAULT_RUBRICS: Omit<CfRubric, 'created_at'>[] = [
  { id: 'normativka', name: 'Обновление нормативки', icon: '📜', color: '#ef4444', sort_order: 1 },
  { id: 'tech', name: 'Новые технологии', icon: '🔬', color: '#a78bfa', sort_order: 2 },
  { id: 'incidents', name: 'Происшествия и последствия', icon: '⚠️', color: '#f59e0b', sort_order: 3 },
  { id: 'clients', name: 'Успехи клиентов', icon: '🏆', color: '#22c55e', sort_order: 4 },
  { id: 'city-tech', name: 'Технологии городского хозяйства', icon: '🏙️', color: '#029cda', sort_order: 5 },
  { id: 'trends', name: 'Тенденции городского управления', icon: '📈', color: '#0284c7', sort_order: 6 },
  { id: 'citizens', name: 'Запросы граждан', icon: '👥', color: '#8b5cf6', sort_order: 7 },
  { id: 'cities', name: 'Новости городов', icon: '🌆', color: '#16a34a', sort_order: 8 },
];

/** 7 платформ по умолчанию — из прототипа контент-завода V2. */
export const DEFAULT_PLATFORMS: Omit<CfPlatform, 'created_at'>[] = [
  {
    id: 'tg', name: 'Telegram', icon: '✈️', status: 'connected', char_limit: 4096,
    formality: 30, emoji_level: 2, hashtags: false, hashtag_count: 0,
    cta: 'Пишите нам: @edinaya_sreda',
    ai_prompt: 'Лаконичный деловой стиль, абзацы разделены пустой строкой, умеренные эмодзи в начале абзацев, без хэштегов, ссылка на контакт в конце.',
    qa_notes: '', sort_order: 1,
  },
  {
    id: 'vk', name: 'ВКонтакте', icon: '🔵', status: 'connected', char_limit: 16000,
    formality: 50, emoji_level: 2, hashtags: true, hashtag_count: 5,
    cta: 'Подписывайтесь на нашу страницу',
    ai_prompt: 'Деловой, но дружелюбный тон. Структура: заголовок → суть → детали → призыв. 3–5 хэштегов в конце. Умеренные эмодзи.',
    qa_notes: '', sort_order: 2,
  },
  {
    id: 'max', name: 'MAX', icon: '💬', status: 'setup', char_limit: 4096,
    formality: 40, emoji_level: 2, hashtags: false, hashtag_count: 0,
    cta: 'Напишите нам в MAX',
    ai_prompt: 'Аналогично Telegram, адаптировать для российской аудитории мессенджера.',
    qa_notes: '', sort_order: 3,
  },
  {
    id: 'zen', name: 'Яндекс Дзен', icon: '📖', status: 'setup', char_limit: 50000,
    formality: 70, emoji_level: 0, hashtags: false, hashtag_count: 0,
    cta: 'Подпишитесь на канал',
    ai_prompt: 'Экспертная статья с подзаголовками H2/H3. Без эмодзи. Объём 1500–3000 слов. SEO-оптимизированный заголовок.',
    qa_notes: '', sort_order: 4,
  },
  {
    id: 'tenchat', name: 'ТенЧат', icon: '💼', status: 'manual', char_limit: 10000,
    formality: 65, emoji_level: 1, hashtags: true, hashtag_count: 3,
    cta: 'Добавляйтесь в контакты',
    ai_prompt: 'B2B экспертный тон. Акцент на профессиональную ценность. Личная подача от имени эксперта компании. 3 хэштега.',
    qa_notes: '', sort_order: 5,
  },
  {
    id: 'ig', name: 'Instagram', icon: '📸', status: 'setup', char_limit: 2200,
    formality: 25, emoji_level: 3, hashtags: true, hashtag_count: 20,
    cta: 'Сохраняйте и делитесь 🔁',
    ai_prompt: 'Живой, визуальный стиль. Обилие эмодзи. Первые 2 строки — цепляющий хук. 15–20 хэштегов в конце.',
    qa_notes: '', sort_order: 6,
  },
  {
    id: 'site', name: 'Сайт / Блог', icon: '🌐', status: 'planned', char_limit: 100000,
    formality: 75, emoji_level: 0, hashtags: false, hashtag_count: 0,
    cta: 'Свяжитесь с нами',
    ai_prompt: 'SEO-статья. Ключевые слова органично в тексте. Структура: H1 → вступление → H2-разделы → FAQ → заключение. Без эмодзи.',
    qa_notes: '', sort_order: 7,
  },
];

export function rubricLabel(rubrics: CfRubric[], id: string | null): string {
  return rubrics.find((r) => r.id === id)?.name ?? 'Без рубрики';
}
export function rubricColor(rubrics: CfRubric[], id: string | null): string {
  return rubrics.find((r) => r.id === id)?.color ?? '#6b7280';
}
export function platformLabel(platforms: CfPlatform[], id: string): string {
  return platforms.find((p) => p.id === id)?.name ?? id;
}

export function relevanceTone(score: number): 'high' | 'med' | 'low' {
  if (score >= 8) return 'high';
  if (score >= 5) return 'med';
  return 'low';
}

const DAY_MS = 86_400_000;
export function weekRange(anchor: number): { from: number; to: number } {
  const d = new Date(anchor);
  const day = (d.getDay() + 6) % 7; // 0 = понедельник
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day).getTime();
  return { from: monday, to: monday + 7 * DAY_MS };
}
