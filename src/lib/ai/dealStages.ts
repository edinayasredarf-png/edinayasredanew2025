/**
 * Канонические воронки продаж «Единой среды» — единый источник правды для
 * речевой аналитики. В Bitrix у компании ТРИ разных воронки, и звонок нужно
 * анализировать по-разному в зависимости от того, в какой из них находится
 * сделка/лид на момент звонка:
 *
 *   1. ЛИД (Bitrix-сущность Lead, до конвертации в сделку) — 8 стадий:
 *      Новый лид → Первичный контакт → Нет ответа/Квалификация/Спам/
 *      Отложенный спрос → Качественный лид (успех) / Некачественный лид (отказ).
 *   2. СДЕЛКА — «Отдел продаж» (воронка первичной продажи) — 14 стадий:
 *      Заявка получена → ... → Успешно реализовано / Закрыто и не реализовано.
 *   3. СДЕЛКА — «Обслуживание сервиса» (пост-продажное сопровождение:
 *      онбординг, обучение, активное использование, пролонгация) — 17 стадий.
 *
 * Составлено по скриншотам настроек воронок Bitrix и документу РОП
 * «Воронка продаж.xlsx» (для воронки «Отдел продаж» — там же подробные
 * рабочие инструкции по каждой стадии).
 */

export type PipelineKey = "lead" | "sales" | "service";

export type LeadStageKey =
  | "lead_new"
  | "lead_first_contact"
  | "lead_no_answer"
  | "lead_qualification"
  | "lead_spam"
  | "lead_deferred_demand"
  | "lead_qualified"
  | "lead_unqualified";

export type SalesStageKey =
  | "sales_application_received"
  | "sales_no_answer"
  | "sales_clarification"
  | "sales_quote_pending"
  | "sales_quote_sent"
  | "sales_quote_read"
  | "sales_deferred_demand"
  | "sales_contract_sent"
  | "sales_contract_signed"
  | "sales_vcs_decision_maker"
  | "sales_inventory_done_elsewhere"
  | "sales_competitor_probe"
  | "sales_successfully_done"
  | "sales_closed_lost";

export type ServiceStageKey =
  | "service_demo_access"
  | "service_application_accepted"
  | "service_access_granted"
  | "service_training_assigned"
  | "service_working_with_client"
  | "service_data_loading"
  | "service_ip_access"
  | "service_confirmed_user"
  | "service_active_user"
  | "service_needs_prolongation"
  | "service_prolonged"
  | "service_volunteers"
  | "service_switched_other_software"
  | "service_closed_unrealized"
  | "service_no_prolongation"
  | "service_application_fulfilled"
  | "service_closed_not_realized";

export type StageKey = LeadStageKey | SalesStageKey | ServiceStageKey | "unknown";

export interface StageInfo {
  key: StageKey;
  pipeline: PipelineKey;
  label: string;
  /** Показательна ли стадия для полноценного разбора звонка (не техническая/финальная). */
  callable: boolean;
  aliases: string[];
}

// ── Воронка 1: ЛИД (Bitrix Lead, entityId=STATUS) ──
export const LEAD_STAGES: StageInfo[] = [
  { key: "lead_new", pipeline: "lead", label: "Новый лид", callable: true, aliases: ["новый лид"] },
  { key: "lead_first_contact", pipeline: "lead", label: "Первичный контакт", callable: true, aliases: ["первичный контакт"] },
  { key: "lead_no_answer", pipeline: "lead", label: "Нет ответа", callable: false, aliases: ["нет ответа"] },
  { key: "lead_qualification", pipeline: "lead", label: "Квалификация", callable: true, aliases: ["квалификация"] },
  { key: "lead_spam", pipeline: "lead", label: "Спам", callable: false, aliases: ["спам"] },
  { key: "lead_deferred_demand", pipeline: "lead", label: "Отложенный спрос", callable: true, aliases: ["отложенный спрос"] },
  { key: "lead_qualified", pipeline: "lead", label: "Качественный лид", callable: false, aliases: ["качественный лид"] },
  { key: "lead_unqualified", pipeline: "lead", label: "Некачественный лид", callable: false, aliases: ["некачественный лид"] },
];

// ── Воронка 2: СДЕЛКА — «Отдел продаж» ──
export const SALES_STAGES: StageInfo[] = [
  { key: "sales_application_received", pipeline: "sales", label: "Заявка получена", callable: true, aliases: ["заявка получена"] },
  { key: "sales_no_answer", pipeline: "sales", label: "Недозвон", callable: false, aliases: ["недозвон", "не дозвон"] },
  { key: "sales_clarification", pipeline: "sales", label: "Уточняющий диалог", callable: true, aliases: ["уточняющий диалог"] },
  { key: "sales_quote_pending", pipeline: "sales", label: "Отправить КП", callable: false, aliases: ["отправить кп"] },
  { key: "sales_quote_sent", pipeline: "sales", label: "КП отправлено", callable: true, aliases: ["кп отправлено", "кп отправлен"] },
  { key: "sales_quote_read", pipeline: "sales", label: "КП прочитано", callable: true, aliases: ["кп прочитано", "кп прочитан"] },
  { key: "sales_deferred_demand", pipeline: "sales", label: "Отложенный спрос", callable: true, aliases: ["отложенный спрос"] },
  { key: "sales_contract_sent", pipeline: "sales", label: "Договор отправлен", callable: true, aliases: ["договор отправлен"] },
  { key: "sales_contract_signed", pipeline: "sales", label: "Договор подписан", callable: false, aliases: ["договор подписан"] },
  {
    key: "sales_vcs_decision_maker",
    pipeline: "sales",
    label: "ВКС / выход на ЛПР",
    callable: true,
    aliases: ["вкс выход на лпр", "вкс / выход на лпр", "выход на лпр", "вкс"],
  },
  { key: "sales_inventory_done_elsewhere", pipeline: "sales", label: "Инвентаризация проведена (без нас)", callable: false, aliases: ["инвентаризация проведена"] },
  {
    key: "sales_competitor_probe",
    pipeline: "sales",
    label: "Потенциальный партнёр / конкурент",
    callable: true,
    aliases: ["потенциальный партнер", "потенциальный партнёр", "конкурент"],
  },
  { key: "sales_successfully_done", pipeline: "sales", label: "Успешно реализовано", callable: false, aliases: ["успешно реализовано"] },
  {
    key: "sales_closed_lost",
    pipeline: "sales",
    label: "Закрыто и не реализовано",
    callable: false,
    aliases: ["закрыто и не реализовано", "закрыто не реализовано"],
  },
];

// ── Воронка 3: СДЕЛКА — «Обслуживание сервиса» (пост-продажа) ──
// Названия стадий здесь говорят сами за себя чуть меньше, чем в «Отделе
// продаж» (для него есть подробная инструкция РОП) — блоки промпта по этой
// воронке в dealStagePrompts.ts составлены по смыслу названия стадии и
// заведомо грубее; стоит уточнить у РОП/руководителя сервиса и доработать.
export const SERVICE_STAGES: StageInfo[] = [
  { key: "service_demo_access", pipeline: "service", label: "Демо-доступ", callable: true, aliases: ["демо доступ", "демо-доступ"] },
  { key: "service_application_accepted", pipeline: "service", label: "Заявка принята", callable: true, aliases: ["заявка принята"] },
  { key: "service_access_granted", pipeline: "service", label: "Выдан доступ", callable: true, aliases: ["выдан доступ"] },
  { key: "service_training_assigned", pipeline: "service", label: "Назначено обучение", callable: true, aliases: ["назначено обучение"] },
  { key: "service_working_with_client", pipeline: "service", label: "Работа с клиентом", callable: true, aliases: ["работа с клиентом"] },
  { key: "service_data_loading", pipeline: "service", label: "Загрузка данных производством", callable: false, aliases: ["загрузка данных производством"] },
  { key: "service_ip_access", pipeline: "service", label: "Доступ ИП", callable: true, aliases: ["доступ ип"] },
  { key: "service_confirmed_user", pipeline: "service", label: "Подтверждённый пользователь", callable: true, aliases: ["подтвержденный пользователь", "подтверждённый пользователь"] },
  { key: "service_active_user", pipeline: "service", label: "Активный пользователь", callable: true, aliases: ["активный пользователь"] },
  { key: "service_needs_prolongation", pipeline: "service", label: "Нужна пролонгация", callable: true, aliases: ["нужна пролонгация"] },
  { key: "service_prolonged", pipeline: "service", label: "Пролонгирован", callable: false, aliases: ["пролонгирован"] },
  { key: "service_volunteers", pipeline: "service", label: "Волонтёры", callable: true, aliases: ["волонтеры", "волонтёры"] },
  { key: "service_switched_other_software", pipeline: "service", label: "Перешли на др. ПО", callable: true, aliases: ["перешли на др по", "перешли на другое по"] },
  { key: "service_closed_unrealized", pipeline: "service", label: "Закрыто и нереализовано", callable: false, aliases: ["закрыто и нереализовано"] },
  { key: "service_no_prolongation", pipeline: "service", label: "Без пролонгации", callable: true, aliases: ["без пролонгации"] },
  { key: "service_application_fulfilled", pipeline: "service", label: "Заявка выполнена", callable: false, aliases: ["заявка выполнена"] },
  {
    key: "service_closed_not_realized",
    pipeline: "service",
    label: "Закрыто и не реализовано",
    callable: false,
    aliases: ["закрыто и не реализовано"],
  },
];

export const ALL_STAGES: StageInfo[] = [...LEAD_STAGES, ...SALES_STAGES, ...SERVICE_STAGES];

export const PIPELINE_LABEL: Record<PipelineKey, string> = {
  lead: "Лид",
  sales: "Отдел продаж",
  service: "Обслуживание сервиса",
};

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(ALL_STAGES.map((s) => [s.key, s.label]));
STAGE_LABEL.unknown = "Этап не определён";

/** Все ключи стадий (все три воронки + "unknown") — для z.enum() в схеме анализа. */
export const STAGE_KEYS = [...ALL_STAGES.map((s) => s.key), "unknown"] as unknown as [StageKey, ...StageKey[]];

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
 * ВНУТРИ конкретной воронки. Сначала точное совпадение, затем — по вхождению
 * алиаса. Воронка передаётся явно, т.к. одно и то же название («Отложенный
 * спрос», «Закрыто и не реализовано» и т.п.) встречается в разных воронках
 * с разным смыслом — резолвится всегда в контексте одной воронки.
 */
export function matchStageInPipeline(pipeline: PipelineKey, bitrixStageName: string | null | undefined): StageKey {
  const norm = normalizeStageName(bitrixStageName || "");
  if (!norm) return "unknown";
  const stages = pipeline === "lead" ? LEAD_STAGES : pipeline === "sales" ? SALES_STAGES : SERVICE_STAGES;
  for (const s of stages) {
    if (s.aliases.some((a) => normalizeStageName(a) === norm)) return s.key;
  }
  for (const s of stages) {
    if (s.aliases.some((a) => norm.includes(normalizeStageName(a)))) return s.key;
  }
  return "unknown";
}

/**
 * Определить, какой из ДВУХ воронок сделок («Отдел продаж» или
 * «Обслуживание сервиса») соответствует категории Bitrix — по набору
 * названий её стадий (у Bitrix в crm.deal.list нет прямого признака, к
 * какой из наших смысловых воронок относится кастомная категория).
 * Считаем очки совпадений с каждой воронкой, выбираем большую; при
 * отсутствии явного перевеса — "unknown" (стадии этой категории не
 * распознаются, но и не путаются с чужой воронкой).
 */
export function classifyDealCategoryPipeline(stageNames: string[]): "sales" | "service" | "unknown" {
  let salesScore = 0;
  let serviceScore = 0;
  for (const name of stageNames) {
    if (matchStageInPipeline("sales", name) !== "unknown") salesScore++;
    if (matchStageInPipeline("service", name) !== "unknown") serviceScore++;
  }
  if (salesScore === 0 && serviceScore === 0) return "unknown";
  return salesScore >= serviceScore ? "sales" : "service";
}

/**
 * 18 причин отложенного спроса (ровно как в документе РОП). Общие для
 * стадии «Отложенный спрос» и в воронке лида, и в воронке «Отдел продаж».
 * `exempt` — причина входит в список исключений из правила «без контакта
 * не больше месяца» (пункты 3,6,7,8,9,10,11,12,17 воронки «Отдел продаж») —
 * по таким сделкам системное касание может планироваться реже раза в месяц.
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
 * (этапы «Новый лид»/«Заявка получена») и «что изменилось с прошлого
 * касания» (этапы «Отложенный спрос» / системное касание). Единый список,
 * т.к. по сути это один и тот же набор внешних событий, меняющих готовность
 * клиента к сделке.
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
