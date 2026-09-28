// zod/v4 — соответствует zodOutputFormat из @anthropic-ai/sdk (импортирует zod/v4).
import * as z from "zod/v4";
import { STAGE_KEYS, DEFERRED_DEMAND_REASON_KEYS, TRIGGER_TYPE_KEYS } from "@/lib/ai/dealStages";

/**
 * Схема AI-анализа звонка (§47 ТЗ). ТОЛЕРАНТНАЯ: недостающие/невалидные поля не
 * роняют разбор, а получают безопасные значения по умолчанию (§72 — при нехватке
 * данных не выдаём догадки, ставим null/пусто/низкий confidence). Это позволяет
 * работать и с моделями послабее (YandexGPT), и с Claude — валидация всегда
 * проходит через Zod (§46), без «сырого» JSON.parse.
 *
 * `.catch(fallback)` срабатывает и на невалидное значение, и на отсутствующее
 * поле (undefined), поэтому явные `.default()` не нужны. Инференс типа стабилен.
 */

export const ANALYSIS_VERSION = "call-analysis-v4";

// ── Толерантные примитивы ──
const nstr = z.string().nullable().catch(null); // string | null
const str = z.string().catch("");
const strArr = z.array(z.string()).catch([]);
const conf = z.number().catch(0); // 0..1 «в идеале», но не роняем на выходе за диапазон

const Participant = z
  .object({
    role: z.enum(["MANAGER", "CLIENT", "UNKNOWN"]).catch("UNKNOWN"),
    name: nstr,
    position: nstr,
    decisionInfluence: z
      .enum(["decision_maker", "influencer", "initiator", "technical", "unknown"])
      .nullable()
      .catch(null),
  })
  .catch({ role: "UNKNOWN", name: null, position: null, decisionInfluence: null });

const Product = z
  .object({ slug: str, name: str, confidence: conf })
  .catch({ slug: "", name: "", confidence: 0 });

const DecisionMaker = z
  .object({
    found: z.boolean().catch(false),
    name: nstr,
    position: nstr,
    influence: z.enum(["high", "medium", "low", "unknown"]).nullable().catch(null),
    participatesInDecision: z.boolean().nullable().catch(null),
  })
  .catch({ found: false, name: null, position: null, influence: null, participatesInDecision: null });

const Budget = z
  .object({
    discussed: z.boolean().catch(false),
    amount: z.number().nullable().catch(null),
    range: nstr,
    source: nstr,
    hasFunding: z.boolean().nullable().catch(null),
  })
  .catch({ discussed: false, amount: null, range: null, source: null, hasFunding: null });

const Timeline = z
  .object({
    discussed: z.boolean().catch(false),
    projectDeadline: nstr,
    plannedYear: z.number().int().nullable().catch(null),
    quarter: nstr,
    urgency: z.enum(["high", "medium", "low"]).nullable().catch(null),
  })
  .catch({ discussed: false, projectDeadline: null, plannedYear: null, quarter: null, urgency: null });

const Procurement = z
  .object({
    mentioned: z.boolean().catch(false),
    signals: strArr,
    law: z.enum(["44-FZ", "223-FZ", "other", "none"]).nullable().catch(null),
    note: nstr,
  })
  .catch({ mentioned: false, signals: [], law: null, note: null });

const Objection = z
  .object({
    text: str,
    // Дословная реплика клиента с возражением — по ней находим момент в аудио.
    quote: nstr,
    raisedBy: z.enum(["CLIENT", "MANAGER", "UNKNOWN"]).catch("UNKNOWN"),
    handled: z.boolean().catch(false),
    managerResponse: nstr,
    responseQuality: z.enum(["good", "average", "poor"]).nullable().catch(null),
    recommendation: nstr,
    // Тайм-коды момента возражения (мс). Проставляются кодом по совпадению quote
    // с сегментом транскрипта (не доверяем таймкодам LLM).
    startMs: z.number().nullable().catch(null),
    endMs: z.number().nullable().catch(null),
  })
  .catch({ text: "", quote: null, raisedBy: "UNKNOWN", handled: false, managerResponse: null, responseQuality: null, recommendation: null, startMs: null, endMs: null });

const Competitor = z
  .object({
    name: str,
    context: nstr,
    whyCompared: nstr,
    theirStrengths: strArr,
    theirWeaknesses: strArr,
  })
  .catch({ name: "", context: null, whyCompared: null, theirStrengths: [], theirWeaknesses: [] });

const Commitment = z
  .object({
    action: str,
    by: z.enum(["MANAGER", "CLIENT"]).catch("MANAGER"),
    deadline: nstr,     // как в разговоре («завтра», «в понедельник»)
    deadlineDate: nstr, // разрешённая дата YYYY-MM-DD (или null)
  })
  .catch({ action: "", by: "MANAGER", deadline: null, deadlineDate: null });

const NextStep = z
  .object({
    exists: z.boolean().catch(false),
    action: nstr,
    owner: z.enum(["MANAGER", "CLIENT", "UNKNOWN"]).nullable().catch(null),
    deadline: nstr,
  })
  .catch({ exists: false, action: null, owner: null, deadline: null });

const Risk = z.object({ type: str, detail: str }).catch({ type: "", detail: "" });

const Tag = z.object({ slug: str, confidence: conf }).catch({ slug: "", confidence: 0 });

const DealScoreFactor = z
  .object({ factor: str, points: z.number().catch(0), reason: str })
  .catch({ factor: "", points: 0, reason: "" });

const DealScore = z
  .object({
    score: z.number().int().catch(0),
    temperature: z.enum(["HOT", "WARM", "COLD"]).catch("COLD"),
    factors: z.array(DealScoreFactor).catch([]),
  })
  .catch({ score: 0, temperature: "COLD", factors: [] });

const ManagerCriterion = z
  .object({
    key: z
      .enum([
        "opening", "discovery", "questions", "pain_identification", "current_situation",
        "decision_maker", "budget", "timeline", "procurement", "objections",
        "product_presentation", "next_step", "follow_up",
      ])
      .catch("opening"),
    score: z.number().catch(0),
    comment: nstr,
  })
  .catch({ key: "opening", score: 0, comment: null });

const ManagerPerformance = z
  .object({
    // null — когда оценивать нечего (разговор не состоялся: автоответчик/бот/недозвон).
    overall: z.number().nullable().catch(null),
    criteria: z.array(ManagerCriterion).catch([]),
    didWell: strArr,
    mistakes: strArr,
    improveNextTime: strArr,
    exampleBetterResponse: nstr,
  })
  .catch({ overall: null, criteria: [], didWell: [], mistakes: [], improveNextTime: [], exampleBetterResponse: null });

// ── Этап сделки/лида (§ речевая аналитика по трём воронкам) ──
// dealStage — служебное поле: заполняется КОДОМ по STAGE_ID сделки/STATUS_ID
// лида из CRM (см. resolveDealStage/resolveLeadStage в analysisService.ts),
// а не LLM — модель его не заполняет, значение из ответа LLM перезаписывается
// сервером перед сохранением. Оставлено в схеме, чтобы поле было частью
// одного объекта анализа (data), а не отдельной колонкой. Название поля
// историческое — покрывает все три воронки (лид/отдел продаж/сервис), не
// только сделки.
const DealStage = z
  .object({
    key: z.enum(STAGE_KEYS).catch("unknown"),
    label: nstr,
    // Какая из трёх воронок: lead (Bitrix Lead) | sales (Отдел продаж) |
    // service (Обслуживание сервиса) | unknown.
    pipeline: z.enum(["lead", "sales", "service", "unknown"]).catch("unknown"),
    source: z.enum(["crm", "unknown"]).catch("unknown"),
  })
  .catch({ key: "unknown", label: null, pipeline: "unknown", source: "unknown" });

// Триггер — «что подтолкнуло клиента обратиться именно сейчас» (этап
// «Заявка получена») или «что изменилось с прошлого касания» (этап
// «Отложенный спрос»/системное касание). Заполняется ТОЛЬКО если клиент
// реально об этом сказал — не выдумывать.
const Trigger = z
  .object({
    present: z.boolean().catch(false),
    type: z.enum(TRIGGER_TYPE_KEYS).catch("none"),
    description: nstr,
    quote: nstr, // дословная фраза клиента про триггер, если есть
  })
  .catch({ present: false, type: "none", description: null, quote: null });

const QuoteSentDetails = z
  .object({
    received: z.boolean().nullable().catch(null),
    understoodPrice: z.boolean().nullable().catch(null),
    hasQuestions: z.boolean().nullable().catch(null),
    additionalServicesOffered: z.boolean().catch(false),
    progressedToNextStep: z.boolean().nullable().catch(null),
  })
  .nullable()
  .catch(null);

const DeferredDemandDetails = z
  .object({
    reason: z.enum(DEFERRED_DEMAND_REASON_KEYS).nullable().catch(null),
    reasonNote: nstr, // текстовое пояснение, особенно важно для "own_reason"
    whatChangedSinceLastContact: nstr,
    expectedDecisionDate: nstr, // YYYY-MM-DD или null — не придумывать, если не названо
    nextContactNotBefore: nstr, // YYYY-MM-DD или null
    whoMakesDecision: nstr,
    whatMustChange: nstr, // какое событие должно произойти, чтобы клиент был готов
  })
  .nullable()
  .catch(null);

const ContractSentDetails = z
  .object({
    status: z
      .enum([
        "not_received", "received_not_reviewed", "on_approval", "has_remarks",
        "awaiting_edits", "approved", "ready_to_sign", "signed", "other",
      ])
      .nullable()
      .catch(null),
    blockers: strArr, // что мешает подписанию прямо сейчас
    whoIsReviewing: nstr,
  })
  .nullable()
  .catch(null);

const ContractSignedDetails = z
  .object({
    confirmed: z.boolean().nullable().catch(null),
    signedBy: nstr,
    allDocsReceived: z.boolean().nullable().catch(null),
    handedToProjectTeam: z.boolean().nullable().catch(null),
    additionalOpportunities: strArr, // доп. возможности, всплывшие в разговоре
  })
  .nullable()
  .catch(null);

const SuccessfullyDoneDetails = z
  .object({
    confirmed: z.boolean().nullable().catch(null),
    serviceDelivered: nstr,
    additionalNeedsFound: strArr,
    nextContactPlanned: z.boolean().nullable().catch(null),
  })
  .nullable()
  .catch(null);

const VcsDmDetails = z
  .object({
    decisionMakerPresent: z.boolean().nullable().catch(null),
    relevantToClientPains: z.boolean().nullable().catch(null),
    dealProgressed: z.boolean().nullable().catch(null),
  })
  .nullable()
  .catch(null);

// Воронка «Обслуживание сервиса» (пост-продажа): онбординг/обучение/
// активность/риск непролонгации — единая компактная группа вместо одной
// группы на каждую из 17 стадий (большинство различий между её стадиями —
// это прогресс по одним и тем же осям, а не разные вопросы).
const ServiceUsageDetails = z
  .object({
    accessGranted: z.boolean().nullable().catch(null),
    trainingCompleted: z.boolean().nullable().catch(null),
    activelyUsing: z.boolean().nullable().catch(null),
    prolongationInterest: z.enum(["yes", "no", "undecided", "unknown"]).catch("unknown"),
    churnRisk: z.enum(["low", "medium", "high"]).nullable().catch(null),
    blockers: strArr, // что мешает пользоваться системой/принять решение о пролонгации
    reasonNote: nstr, // причина непролонгации/перехода на другое ПО, если прозвучала
  })
  .nullable()
  .catch(null);

// Подробности по ТЕКУЩЕМУ этапу (dealStage.key). Заполняется ТОЛЬКО группа,
// соответствующая этапу из КОНТЕКСТА промпта — остальные остаются null
// (часть этапов lead/sales-воронок отдельной группы не имеет — там
// достаточно универсальных полей выше: trigger, needs, commitments, nextStep).
const StageDetails = z
  .object({
    quoteSent: QuoteSentDetails,
    deferredDemand: DeferredDemandDetails,
    contractSent: ContractSentDetails,
    contractSigned: ContractSignedDetails,
    successfullyDone: SuccessfullyDoneDetails,
    vcsDm: VcsDmDetails,
    serviceUsage: ServiceUsageDetails,
  })
  .catch({
    quoteSent: null, deferredDemand: null, contractSent: null,
    contractSigned: null, successfullyDone: null, vcsDm: null, serviceUsage: null,
  });

const NextStageSuggestion = z
  .object({
    // null, если данных недостаточно (§ «не определяй по последней фразе» —
    // только по совокупности сигналов разговора).
    suggested: z.enum(STAGE_KEYS).nullable().catch(null),
    reasoning: nstr,
    confidence: conf,
  })
  .catch({ suggested: null, reasoning: null, confidence: 0 });

export const CallAnalysisSchema = z.object({
  summary: str,

  // Состоялся ли разговор с реальным человеком. false — автоответчик, голосовой
  // помощник/робот, IVR, гудки/не ответили, сброс, ошибка номера, тишина.
  connected: z.boolean().catch(true),
  noContactReason: nstr, // 'автоответчик' | 'голосовой помощник' | 'не ответили' | 'сброс' | ...

  // Тип звонка — для группировки и справедливой оценки.
  // system_touch — системное касание по сделке в «Отложенном спросе»: не
  // клиент инициировал контакт, а менеджер звонит планово проверить, не
  // изменились ли обстоятельства (бюджет/ЛПР/сроки/триггер).
  callType: z
    .enum([
      "first_contact", "discovery", "presentation", "demo", "negotiation",
      "follow_up", "clarification", "closing", "support", "system_touch", "other",
    ])
    .catch("other"),
  // Показателен ли звонок для оценки НАВЫКОВ менеджера. false — краткий/уточняющий/
  // технический звонок (быстро сверили, продублировали, уточнили деталь): по нему
  // менеджера НЕ оцениваем по полной рубрике (несправедливо).
  managerScoreApplicable: z.boolean().catch(true),

  result: z
    .object({
      type: z
        .enum(["agreed", "not_agreed", "callback", "meeting_set", "send_quote", "not_interested", "other"])
        .catch("other"),
      confidence: conf,
    })
    .catch({ type: "other", confidence: 0 }),

  client: z
    .object({
      organizationType: nstr,
      organizationName: nstr,
      region: nstr,
      industry: nstr,
      currentProcess: nstr,
      usedSystems: strArr,
    })
    .catch({ organizationType: null, organizationName: null, region: null, industry: null, currentProcess: null, usedSystems: [] }),

  participants: z.array(Participant).catch([]),

  needs: strArr,
  painPoints: strArr,
  products: z.array(Product).catch([]),
  currentSolution: strArr,

  decisionMaker: DecisionMaker,
  budget: Budget,
  timeline: Timeline,
  procurement: Procurement,

  competitors: z.array(Competitor).catch([]),
  objections: z.array(Objection).catch([]),
  commitments: z.array(Commitment).catch([]),

  nextStep: NextStep,
  risks: z.array(Risk).catch([]),
  tags: z.array(Tag).catch([]),

  dealScore: DealScore,
  managerPerformance: ManagerPerformance,

  dealStage: DealStage,
  trigger: Trigger,
  stageDetails: StageDetails,
  nextStageSuggestion: NextStageSuggestion,

  confidence: z
    .object({
      overall: conf,
      dealScore: conf,
      product: conf,
      decisionMaker: conf,
    })
    .catch({ overall: 0, dealScore: 0, product: 0, decisionMaker: 0 }),
});

export type CallAnalysis = z.infer<typeof CallAnalysisSchema>;
