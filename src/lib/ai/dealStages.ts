/**
 * Канонические воронки «Единой среды» — единый источник правды для речевой
 * аналитики. В Bitrix у компании ЧЕТЫРЕ разных воронки, и звонок нужно
 * анализировать по-разному в зависимости от того, в какой из них находится
 * сделка/лид на момент звонка:
 *
 *   1. ЛИД (Bitrix-сущность Lead, до конвертации в сделку) — 8 статусов:
 *      Новый лид → Первичный контакт → Нет ответа/Квалификация/Спам/
 *      Отложенный спрос → Качественный лид (успех) / Некачественный лид (отказ).
 *   2. СДЕЛКА — «Отдел продаж» (первичная продажа, дефолтная категория 0) —
 *      14 стадий: Заявка получена → ... → Успешно реализовано / Закрыто и не
 *      реализовано.
 *   3. СДЕЛКА — «Обслуживание сервиса» (категория C1, пост-продажное
 *      сопровождение: онбординг, обучение, активное использование,
 *      пролонгация) — 17 стадий.
 *   4. СДЕЛКА — «Управление проектами» (категория C5, исполнение уже
 *      подписанного контракта: производство/сдача работ, оплата,
 *      просроченная задолженность) — 9 стадий.
 *
 * STAGE_ID/STATUS_ID у Bitrix НЕ переводится в читаемое название и может
 * повторяться между категориями со сходным смыслом (напр. NEW/WON/LOSE), но
 * при этом Bitrix одинаковые ПО СМЫСЛУ названия («Закрыто и не реализовано»)
 * в разных категориях кодирует РАЗНЫМИ STAGE_ID — поэтому канонический
 * источник правды здесь BITRIX_DEAL_STAGE_MAP/BITRIX_LEAD_STATUS_MAP
 * (получены напрямую от РОП — коды стадий Bitrix для всех 4 воронок), а
 * сопоставление по тексту названия (matchStageInPipeline/
 * classifyDealCategoryPipeline) — лишь резервный способ для стадий, которых
 * ещё нет в этой карте (например, если в Bitrix позже добавят новую стадию).
 */

export type PipelineKey = "lead" | "sales" | "service" | "project";

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

export type ProjectStageKey =
  | "project_new"
  | "project_in_progress"
  | "project_contracts_es_2025"
  | "project_contracts_es_2026"
  | "project_prolongations_2026"
  | "project_delivered_unpaid"
  | "project_overdue_debt"
  | "project_successful"
  | "project_closed_not_realized";

export type StageKey = LeadStageKey | SalesStageKey | ServiceStageKey | ProjectStageKey | "unknown";

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

// ── Воронка 4: СДЕЛКА — «Управление проектами» (исполнение подписанного контракта) ──
export const PROJECT_STAGES: StageInfo[] = [
  { key: "project_new", pipeline: "project", label: "Новые", callable: false, aliases: ["новые"] },
  { key: "project_in_progress", pipeline: "project", label: "В работе", callable: true, aliases: ["в работе"] },
  { key: "project_contracts_es_2025", pipeline: "project", label: "Контракты по ЕС 2025", callable: true, aliases: ["контракты по ес 2025"] },
  { key: "project_contracts_es_2026", pipeline: "project", label: "Контракты по ЕС 2026", callable: true, aliases: ["контракты по ес 2026"] },
  { key: "project_prolongations_2026", pipeline: "project", label: "Пролонгации 2026", callable: true, aliases: ["пролонгации 2026"] },
  { key: "project_delivered_unpaid", pipeline: "project", label: "Сданные, но неоплаченные", callable: true, aliases: ["сданные но неоплаченные", "сданные, но неоплаченные"] },
  { key: "project_overdue_debt", pipeline: "project", label: "Просроченная задолженность", callable: true, aliases: ["просроченная задолженность"] },
  { key: "project_successful", pipeline: "project", label: "Успешно", callable: false, aliases: ["успешно"] },
  { key: "project_closed_not_realized", pipeline: "project", label: "Закрыто и не реализовано", callable: false, aliases: ["закрыто и не реализовано"] },
];

export const ALL_STAGES: StageInfo[] = [...LEAD_STAGES, ...SALES_STAGES, ...SERVICE_STAGES, ...PROJECT_STAGES];

export const PIPELINE_LABEL: Record<PipelineKey, string> = {
  lead: "Лид",
  project: "Управление проектами",
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
const STAGES_BY_PIPELINE: Record<PipelineKey, StageInfo[]> = {
  lead: LEAD_STAGES,
  sales: SALES_STAGES,
  service: SERVICE_STAGES,
  project: PROJECT_STAGES,
};

export function matchStageInPipeline(pipeline: PipelineKey, bitrixStageName: string | null | undefined): StageKey {
  const norm = normalizeStageName(bitrixStageName || "");
  if (!norm) return "unknown";
  const stages = STAGES_BY_PIPELINE[pipeline];
  for (const s of stages) {
    if (s.aliases.some((a) => normalizeStageName(a) === norm)) return s.key;
  }
  for (const s of stages) {
    if (s.aliases.some((a) => norm.includes(normalizeStageName(a)))) return s.key;
  }
  return "unknown";
}

/**
 * Определить, какой из ТРЁХ воронок сделок («Отдел продаж», «Обслуживание
 * сервиса» или «Управление проектами») соответствует категории Bitrix — по
 * набору названий её стадий (у Bitrix в crm.deal.list нет прямого признака,
 * к какой из наших смысловых воронок относится кастомная категория).
 * Считаем очки совпадений с каждой воронкой, выбираем наибольшую; при
 * отсутствии явного перевеса — "unknown" (стадии этой категории не
 * распознаются, но и не путаются с чужой воронкой).
 *
 * РЕЗЕРВНЫЙ способ — основной источник истины для уже известных категорий
 * (0, C1, C5) — BITRIX_DEAL_STAGE_MAP ниже (точные коды от РОП), сюда
 * попадают только категории, которых там нет (например, если в Bitrix
 * позже заведут новую категорию).
 */
export function classifyDealCategoryPipeline(stageNames: string[]): "sales" | "service" | "project" | "unknown" {
  const scores: Record<"sales" | "service" | "project", number> = { sales: 0, service: 0, project: 0 };
  for (const name of stageNames) {
    for (const p of ["sales", "service", "project"] as const) {
      if (matchStageInPipeline(p, name) !== "unknown") scores[p]++;
    }
  }
  const best = (["sales", "service", "project"] as const).reduce((a, b) => (scores[b] > scores[a] ? b : a));
  return scores[best] === 0 ? "unknown" : best;
}

/**
 * Точные коды STAGE_ID сделки → канонический ключ. Получены напрямую от
 * РОП (не автоматически) — основной источник истины для резолвера
 * (см. resolveDealStage в src/lib/server/bitrix/dealStages.ts), сопоставление
 * по названию используется только как резерв для стадий, которых здесь нет.
 *
 * "Отдел продаж" — дефолтная категория Bitrix (0), коды без префикса.
 * "Обслуживание сервиса" — категория C1. "Управление проектами" — C5.
 */
export const BITRIX_DEAL_STAGE_MAP: Record<string, StageKey> = {
  // Отдел продаж (категория 0)
  NEW: "sales_application_received",
  UC_2G5Q1G: "sales_no_answer",
  EXECUTING: "sales_clarification",
  UC_SY8BG2: "sales_quote_pending",
  "1": "sales_quote_sent",
  "2": "sales_quote_read",
  FINAL_INVOICE: "sales_deferred_demand",
  "4": "sales_contract_sent",
  "5": "sales_contract_signed",
  UC_TXE0Y0: "sales_vcs_decision_maker",
  UC_1H3H39: "sales_inventory_done_elsewhere",
  UC_SQ0KOH: "sales_competitor_probe",
  WON: "sales_successfully_done",
  LOSE: "sales_closed_lost",

  // Обслуживание сервиса (категория C1)
  "C1:UC_D6V08Y": "service_demo_access",
  "C1:NEW": "service_application_accepted",
  "C1:AMO_94DD234A": "service_access_granted",
  "C1:PREPARATION": "service_training_assigned",
  "C1:PREPAYMENT_INVOICE": "service_working_with_client",
  "C1:UC_52AT6C": "service_data_loading",
  "C1:UC_5H1KN8": "service_ip_access",
  "C1:UC_1HFQPQ": "service_confirmed_user",
  "C1:UC_496NPW": "service_active_user",
  "C1:UC_RV9YKV": "service_needs_prolongation",
  "C1:UC_5LQY3E": "service_prolonged",
  "C1:UC_23N1KN": "service_volunteers",
  "C1:UC_JDD0F1": "service_switched_other_software",
  "C1:UC_HKYS1J": "service_closed_unrealized",
  "C1:UC_IVXYE3": "service_no_prolongation",
  "C1:WON": "service_application_fulfilled",
  "C1:LOSE": "service_closed_not_realized",

  // Управление проектами (категория C5)
  "C5:NEW": "project_new",
  "C5:EXECUTING": "project_in_progress",
  "C5:UC_1Q2N96": "project_contracts_es_2025",
  "C5:UC_YIFVAT": "project_contracts_es_2026",
  "C5:UC_JQT38V": "project_prolongations_2026",
  "C5:FINAL_INVOICE": "project_delivered_unpaid",
  "C5:UC_H9PW1N": "project_overdue_debt",
  "C5:WON": "project_successful",
  "C5:LOSE": "project_closed_not_realized",
};

/** Точные коды STATUS_ID лида → канонический ключ (получены от РОП). */
export const BITRIX_LEAD_STATUS_MAP: Record<string, StageKey> = {
  NEW: "lead_new",
  "1": "lead_first_contact",
  UC_FN9966: "lead_no_answer",
  UC_X9PO25: "lead_qualification",
  UC_LQQIQ3: "lead_spam",
  UC_35KIVN: "lead_deferred_demand",
  CONVERTED: "lead_qualified",
  JUNK: "lead_unqualified",
};

/** Воронка канонического ключа стадии (для пары с BITRIX_*_MAP, где pipeline не хранится отдельно). */
export function pipelineOfStageKey(key: StageKey): PipelineKey | "unknown" {
  return ALL_STAGES.find((s) => s.key === key)?.pipeline ?? "unknown";
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
