/**
 * Каноническая воронка продаж «Единой среды» — единый источник правды для
 * речевой аналитики. Составлено по документу РОП «Воронка продаж.xlsx»
 * (лист «воронка»): реальные названия стадий Bitrix, 18 причин отложенного
 * спроса, правило частоты касания.
 *
 * Зачем отдельный "канонический" ключ, а не сырой Bitrix STAGE_ID:
 * STAGE_ID у кастомных воронок Bitrix (вида "C2:UC_XXXX") ничего не говорит
 * о смысле стадии и может отличаться между порталами/пересозданием воронки.
 * Сопоставление STAGE_ID → канонический ключ делается по человекочитаемому
 * названию стадии (см. src/lib/server/bitrix/dealStages.ts).
 */

export type DealStageKey =
  | "lead_received" // Заявка получена
  | "no_answer" // Не дозвон
  | "clarification" // Уточняющий диалог
  | "quote_pending" // Отправить КП (обычно без звонка)
  | "quote_sent" // КП Отправлено
  | "vcs_decision_maker" // ВКС / выход на ЛПР
  | "deferred_demand" // Отложенный спрос (+ системные касания)
  | "contract_sent" // Договор отправлен
  | "contract_signed" // Договор подписан
  | "successfully_done" // Успешно реализовано
  | "inventory_done_elsewhere" // Инвентаризация проведена (без нас)
  | "competitor_probe" // Потенциальный партнёр → конкурент (прощупывает закупку)
  | "closed_lost" // Закрыто не реализовано
  | "unknown"; // не удалось сопоставить с воронкой

export interface DealStageInfo {
  key: DealStageKey;
  label: string;
  /** Показательный ли этап для полноценного звонка-разбора (не технический). */
  callable: boolean;
  /** Строки названия стадии в Bitrix, по которым её узнаём (нормализуются при сравнении). */
  aliases: string[];
}

// Порядок — как в воронке РОП (для сортировки в отчётах/выпадающих списках).
export const DEAL_STAGES: DealStageInfo[] = [
  { key: "lead_received", label: "Заявка получена", callable: true, aliases: ["заявка получена"] },
  { key: "no_answer", label: "Не дозвон", callable: false, aliases: ["не дозвон"] },
  { key: "clarification", label: "Уточняющий диалог", callable: true, aliases: ["уточняющий диалог"] },
  { key: "quote_pending", label: "Отправить КП", callable: false, aliases: ["отправить кп"] },
  { key: "quote_sent", label: "КП отправлено", callable: true, aliases: ["кп отправлено", "кп отправлен"] },
  {
    key: "vcs_decision_maker",
    label: "ВКС / выход на ЛПР",
    callable: true,
    aliases: ["вкс выход на лпр", "вкс / выход на лпр", "выход на лпр", "вкс"],
  },
  { key: "deferred_demand", label: "Отложенный спрос", callable: true, aliases: ["отложенный спрос"] },
  { key: "contract_sent", label: "Договор отправлен", callable: true, aliases: ["договор отправлен"] },
  { key: "contract_signed", label: "Договор подписан", callable: false, aliases: ["договор подписан"] },
  { key: "successfully_done", label: "Успешно реализовано", callable: false, aliases: ["успешно реализовано"] },
  {
    key: "inventory_done_elsewhere",
    label: "Инвентаризация проведена (без нас)",
    callable: false,
    aliases: ["инвентаризация проведена"],
  },
  {
    key: "competitor_probe",
    label: "Потенциальный партнёр / конкурент",
    callable: true,
    aliases: ["потенциальный партнер", "потенциальный партнёр", "конкурент"],
  },
  { key: "closed_lost", label: "Закрыто не реализовано", callable: false, aliases: ["закрыто не реализовано"] },
];

export const DEAL_STAGE_LABEL: Record<DealStageKey, string> = Object.fromEntries(
  DEAL_STAGES.map((s) => [s.key, s.label])
) as Record<DealStageKey, string>;
DEAL_STAGE_LABEL.unknown = "Этап не определён";

/** Все канонические ключи стадий (включая "unknown") — для z.enum() в схеме анализа. */
export const DEAL_STAGE_KEYS = [...DEAL_STAGES.map((s) => s.key), "unknown"] as unknown as [
  DealStageKey,
  ...DealStageKey[],
];

/** Нормализация для сопоставления названий стадий (регистр/ё/пробелы/пунктуация). */
export function normalizeStageName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Сопоставить человекочитаемое название стадии Bitrix с каноническим ключом
 * воронки. Сначала точное совпадение, затем — по вхождению алиаса.
 */
export function matchStageByName(bitrixStageName: string | null | undefined): DealStageKey {
  const norm = normalizeStageName(bitrixStageName || "");
  if (!norm) return "unknown";
  for (const s of DEAL_STAGES) {
    if (s.aliases.some((a) => normalizeStageName(a) === norm)) return s.key;
  }
  for (const s of DEAL_STAGES) {
    if (s.aliases.some((a) => norm.includes(normalizeStageName(a)))) return s.key;
  }
  return "unknown";
}

/**
 * 18 причин отложенного спроса (ровно как в документе РОП). `exempt` —
 * причина входит в список исключений из правила «без контакта не больше
 * месяца» (пункты 3,6,7,8,9,10,11,12,17 воронки) — по таким сделкам системное
 * касание может планироваться реже раза в месяц.
 */
export const DEFERRED_DEMAND_REASONS = [
  { key: "contract_on_approval", label: "Контракт/КП на согласовании", exempt: false },
  { key: "no_money_interested", label: "Денег нет, но интерес есть", exempt: false },
  { key: "no_money_no_interest", label: "Денег нет, интереса нет", exempt: true },
  { key: "pending_leadership_review", label: "На рассмотрении у главы/руководителя", exempt: false },
  { key: "duma_1_month", label: "Дума (заседание/сессия) — решение через 1 месяц", exempt: false },
  { key: "duma_3_months", label: "Дума — решение через 3 месяца", exempt: true },
  { key: "duma_6_months", label: "Дума — решение через 6 месяцев", exempt: true },
  { key: "budget_next_year", label: "Закладывают бюджет на следующий год", exempt: true },
  { key: "needs_push_from_above", label: "Нужен «пинок» главе от вышестоящего руководства", exempt: true },
  { key: "not_priority", label: "Наша услуга не первоочередная", exempt: true },
  { key: "merger_2027", label: "Объединение СП в округ в 2027 году", exempt: true },
  { key: "merger_2028", label: "Объединение СП в округ в 2028 году", exempt: true },
  { key: "too_expensive", label: "Очень дорого", exempt: false },
  { key: "monitoring_market", label: "Мониторят рынок", exempt: false },
  { key: "concerned_about_prolongation", label: "Смущает наличие пролонгации", exempt: false },
  { key: "has_regional_system", label: "Уже есть региональная система", exempt: false },
  { key: "has_competitor_system", label: "Есть система конкурентов", exempt: true },
  { key: "own_reason", label: "Свой вариант (см. текстовое пояснение)", exempt: false },
] as const;

export type DeferredDemandReasonKey = (typeof DEFERRED_DEMAND_REASONS)[number]["key"];

export const DEFERRED_DEMAND_REASON_KEYS = DEFERRED_DEMAND_REASONS.map((r) => r.key) as [
  DeferredDemandReasonKey,
  ...DeferredDemandReasonKey[],
];

export const DEFERRED_DEMAND_REASON_LABEL: Record<string, string> = Object.fromEntries(
  DEFERRED_DEMAND_REASONS.map((r) => [r.key, r.label])
);

export const DEFERRED_DEMAND_EXEMPT_KEYS = new Set(
  DEFERRED_DEMAND_REASONS.filter((r) => r.exempt).map((r) => r.key)
);

/**
 * Таксономия триггеров — «что подтолкнуло клиента обратиться именно сейчас»
 * (этап «Заявка получена») и «что изменилось с прошлого касания» (этап
 * «Отложенный спрос» / системное касание). Единый список, т.к. по сути это
 * один и тот же набор внешних событий, меняющих готовность клиента к сделке.
 *
 * Сегодня триггер фиксируется LLM только со слов клиента в разговоре (поле
 * `trigger` в callAnalysis.ts). Этот же справочник типов рассчитан на будущую
 * фичу автопоиска триггеров из новостей/госреестров (план — см.
 * docs/ai-sales/stage-analysis-and-triggers.md) — она не реализована, но
 * когда появится, будет использовать те же ключи TRIGGER_TYPES.
 */
export const TRIGGER_TYPES = [
  {
    key: "prosecutor_order",
    label: "Предписание/представление прокуратуры или иного контролирующего органа",
  },
  { key: "superior_instruction", label: "Поручение вышестоящего органа/руководства" },
  { key: "new_legislation", label: "Новое или изменившееся законодательство/НПА, обязывающее провести работы" },
  { key: "leadership_change", label: "Сменился глава/руководитель (администрации, МУП, учреждения)" },
  { key: "budget_prepared", label: "Появился/заложен бюджет" },
  { key: "municipal_program", label: "Включение в муниципальную/региональную/федеральную программу или нацпроект" },
  { key: "procurement_planned", label: "В плане закупок появилась позиция по нашей теме (44-ФЗ/223-ФЗ)" },
  { key: "competitor_contract_ending", label: "Заканчивается контракт с конкурентом или региональной системой" },
  { key: "media_complaint", label: "Жалобы/резонанс в СМИ или соцсетях (кладбища, зелёные насаждения, ЖКХ)" },
  { key: "merger_completed", label: "Завершилось объединение СП в округ" },
  { key: "audit_or_inspection", label: "Проверка/аудит выявили проблему учёта" },
  { key: "other", label: "Другой триггер (см. описание)" },
  { key: "none", label: "Триггер не выявлен / рутинное касание по расписанию" },
] as const;

export type TriggerTypeKey = (typeof TRIGGER_TYPES)[number]["key"];

export const TRIGGER_TYPE_KEYS = TRIGGER_TYPES.map((t) => t.key) as [TriggerTypeKey, ...TriggerTypeKey[]];

export const TRIGGER_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  TRIGGER_TYPES.map((t) => [t.key, t.label])
);
