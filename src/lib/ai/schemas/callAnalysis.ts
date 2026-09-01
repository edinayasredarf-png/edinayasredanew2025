// zod/v4 — соответствует zodOutputFormat из @anthropic-ai/sdk (импортирует zod/v4).
import * as z from "zod/v4";

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

export const ANALYSIS_VERSION = "call-analysis-v1";

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
    raisedBy: z.enum(["CLIENT", "MANAGER", "UNKNOWN"]).catch("UNKNOWN"),
    handled: z.boolean().catch(false),
    managerResponse: nstr,
    responseQuality: z.enum(["good", "average", "poor"]).nullable().catch(null),
    recommendation: nstr,
  })
  .catch({ text: "", raisedBy: "UNKNOWN", handled: false, managerResponse: null, responseQuality: null, recommendation: null });

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
    deadline: nstr,
  })
  .catch({ action: "", by: "MANAGER", deadline: null });

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

export const CallAnalysisSchema = z.object({
  summary: str,

  // Состоялся ли разговор с реальным человеком. false — автоответчик, голосовой
  // помощник/робот, IVR, гудки/не ответили, сброс, ошибка номера, тишина.
  connected: z.boolean().catch(true),
  noContactReason: nstr, // 'автоответчик' | 'голосовой помощник' | 'не ответили' | 'сброс' | ...

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
