/**
 * Каталог блоков личных сообщений в Bitrix: что можно включить в уведомление по разговору или сделке.
 * Без server-only: каталог нужен и интерфейсу настроек, и серверной сборке сообщения.
 */
export type NotifySource = "call" | "deal";

export interface NotifyBlockDef { key: string; title: string; hint: string }

export const CALL_BLOCKS: NotifyBlockDef[] = [
  { key: "summary", title: "Кратко о разговоре", hint: "Резюме звонка в 2–3 предложениях" },
  { key: "coach", title: "Как лучше было ответить", hint: "Пример лучшего ответа менеджера из разбора" },
  { key: "didWell", title: "Что получилось", hint: "Сильные стороны менеджера в разговоре" },
  { key: "mistakes", title: "Ошибки", hint: "Что менеджер сделал не так" },
  { key: "improve", title: "Что улучшить в следующий раз", hint: "Рекомендации по разговору" },
  { key: "objections", title: "Возражения клиента и как отвечать", hint: "Неотработанные или слабо отработанные возражения с рекомендацией" },
  { key: "nextStep", title: "Следующий шаг", hint: "Договорённость о дальнейших действиях" },
  { key: "commitments", title: "Обещания", hint: "Кто что пообещал и к какому сроку" },
  { key: "needs", title: "Потребности и боли клиента", hint: "Что нужно клиенту" },
  { key: "risks", title: "Риски", hint: "Что угрожает сделке" },
  { key: "scores", title: "Оценки", hint: "Оценка менеджера, оценка сделки и температура" },
];

export const DEAL_BLOCKS: NotifyBlockDef[] = [
  { key: "dealSummary", title: "Сводка по сделке", hint: "Как шла сделка в целом" },
  { key: "nextBestAction", title: "Что делать дальше", hint: "Лучший следующий шаг по сделке" },
  { key: "risks", title: "Риски", hint: "Что угрожает сделке" },
  { key: "keyFacts", title: "Ключевые факты", hint: "Бюджет, сроки, лицо, принимающее решение, продукты" },
  { key: "coaching", title: "Что улучшить менеджеру", hint: "Слабые стороны и рекомендации по сделке" },
  { key: "strengths", title: "Сильные стороны менеджера", hint: "Что хорошо получается по сделке" },
  { key: "stage", title: "Рекомендация по стадии", hint: "Куда перевести сделку" },
  { key: "scores", title: "Оценки", hint: "Оценка сделки, температура, оценка менеджера" },
];

export const BLOCKS: Record<NotifySource, NotifyBlockDef[]> = { call: CALL_BLOCKS, deal: DEAL_BLOCKS };

export interface NotifyRule {
  id: string;
  name: string;
  enabled: boolean;
  source: NotifySource;
  recipients: { owner: boolean; managerIds: string[]; rop: boolean };
  /** null — по всем менеджерам; иначе правило срабатывает только по разговорам/сделкам перечисленных сотрудников. */
  onlyManagers: string[] | null;
  blocks: string[];
  /** Индивидуальный набор блоков для сотрудника (Bitrix-ID → блоки); у остальных — общий `blocks`. */
  managerBlocks?: Record<string, string[]>;
  conditions: {
    maxAgeHours: number;            // для разговоров: не старше N часов
    temperatures: Array<"HOT" | "WARM" | "COLD">; // пусто — любая
    managerScoreBelow: number | null; // оценка менеджера (0–10) не выше N
    dealScoreAtLeast: number | null;  // оценка сделки (0–100) не ниже N
    onlyConnected: boolean;           // только состоявшиеся разговоры
    skipTechnical: boolean;           // пропускать технические/короткие звонки
  };
}

export const DEFAULT_NOTIFY_RULES: NotifyRule[] = [
  {
    id: "call-coach", name: "Разбор звонка менеджеру", enabled: true, source: "call",
    recipients: { owner: true, managerIds: [], rop: false }, onlyManagers: null, blocks: ["coach"],
    conditions: { maxAgeHours: 48, temperatures: [], managerScoreBelow: null, dealScoreAtLeast: null, onlyConnected: true, skipTechnical: true },
  },
  {
    id: "call-weak-rop", name: "Слабый разговор — РОПу", enabled: false, source: "call",
    recipients: { owner: false, managerIds: [], rop: true }, onlyManagers: null, blocks: ["summary", "scores", "mistakes", "improve"],
    conditions: { maxAgeHours: 48, temperatures: [], managerScoreBelow: 5, dealScoreAtLeast: null, onlyConnected: true, skipTechnical: true },
  },
  {
    id: "deal-hot-rop", name: "Горячая сделка — РОПу и менеджеру", enabled: false, source: "deal",
    recipients: { owner: true, managerIds: [], rop: true }, onlyManagers: null, blocks: ["dealSummary", "nextBestAction", "risks"],
    conditions: { maxAgeHours: 48, temperatures: ["HOT"], managerScoreBelow: null, dealScoreAtLeast: null, onlyConnected: true, skipTechnical: false },
  },
];
