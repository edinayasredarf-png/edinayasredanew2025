// Общие типы «Новостного радара» — мониторинг новостей по ключевым словам
// для создания материалов, статей и лидогенерации. Файл без server-only,
// используется и на клиенте (админ-UI), и на сервере (БД/сбор).

export type RadarCategory =
  | 'burial'
  | 'greening'
  | 'municipal'
  | 'digital'
  | 'budget'
  | 'staff'
  | 'other';

export const RADAR_CATEGORIES: { key: RadarCategory; label: string; color: string }[] = [
  { key: 'burial', label: 'Места захоронений', color: '#8b5cf6' },
  { key: 'greening', label: 'Зелёные насаждения', color: '#22c55e' },
  { key: 'municipal', label: 'Муниципальные территории', color: '#0ea5e9' },
  { key: 'digital', label: 'Цифровизация города', color: '#f59e0b' },
  { key: 'budget', label: 'Бюджеты и субсидии', color: '#ef4444' },
  { key: 'staff', label: 'Кадровые смены', color: '#ec4899' },
  { key: 'other', label: 'Другое', color: '#6b7280' },
];

export type RadarStatus = 'new' | 'interesting' | 'used' | 'lead' | 'dismissed';

export const RADAR_STATUSES: { key: RadarStatus; label: string }[] = [
  { key: 'new', label: 'Новое' },
  { key: 'interesting', label: 'Интересно' },
  { key: 'lead', label: 'Лид' },
  { key: 'used', label: 'В работе / статья' },
  { key: 'dismissed', label: 'Скрыто' },
];

export type RadarTriggerKind = 'keyword' | 'rss';

export interface RadarTrigger {
  id: string;
  kind: RadarTriggerKind;
  /** Ключевая фраза (для Google News) либо URL RSS-ленты */
  query: string;
  label: string;
  category: RadarCategory;
  enabled: boolean;
  created_at: number;
}

export interface RadarItem {
  id: string;
  trigger_id: string | null;
  category: RadarCategory;
  title: string;
  link: string;
  source_name: string;
  snippet: string;
  published_at: number;
  status: RadarStatus;
  created_at: number;
}

/**
 * Триггеры по умолчанию — по ключевым темам компании. Засеиваются в БД при
 * первом обращении, если таблица триггеров пуста. Запросы рассчитаны на поиск
 * Google News (поддерживает OR и кавычки для точных фраз).
 */
export const DEFAULT_RADAR_TRIGGERS: Omit<RadarTrigger, 'id' | 'created_at'>[] = [
  {
    kind: 'keyword',
    category: 'burial',
    enabled: true,
    label: 'Инвентаризация захоронений',
    query: '"инвентаризация мест захоронений" OR "реестр кладбищ" OR "учёт захоронений" OR "оцифровка кладбищ"',
  },
  {
    kind: 'keyword',
    category: 'greening',
    enabled: true,
    label: 'Инвентаризация зелёных насаждений',
    query: '"инвентаризация зелёных насаждений" OR "реестр зелёных насаждений" OR "паспортизация озеленения"',
  },
  {
    kind: 'keyword',
    category: 'municipal',
    enabled: true,
    label: 'Управление мун. территориями',
    query: '"управление муниципальными территориями" OR "благоустройство муниципалитет" OR "формирование комфортной городской среды"',
  },
  {
    kind: 'keyword',
    category: 'digital',
    enabled: true,
    label: 'Цифровизация города',
    query: '"цифровизация города" OR "цифровой двойник города" OR "оцифровка территории" OR "умный город"',
  },
  {
    kind: 'keyword',
    category: 'budget',
    enabled: true,
    label: 'Бюджеты и субсидии',
    query: '"субсидия на озеленение" OR "бюджет на цифровизацию" OR "грант на благоустройство" OR "средства на инвентаризацию"',
  },
  {
    kind: 'keyword',
    category: 'staff',
    enabled: true,
    label: 'Кадровые смены в администрациях',
    query: '"назначен глава администрации" OR "новый глава района" OR "сменился мэр" OR "назначен заместитель главы"',
  },
];

export function radarCategoryLabel(key: string): string {
  return RADAR_CATEGORIES.find((c) => c.key === key)?.label ?? 'Другое';
}
export function radarCategoryColor(key: string): string {
  return RADAR_CATEGORIES.find((c) => c.key === key)?.color ?? '#6b7280';
}
