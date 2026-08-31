// zod/v4 — соответствует zodOutputFormat из @anthropic-ai/sdk (импортирует zod/v4).
import * as z from "zod/v4";

/**
 * Схема AI-анализа звонка (§47 ТЗ). Расширяемая, но строго валидируемая.
 *
 * Принцип: если информации в разговоре НЕ было — поле null / пустой массив.
 * AI не выдумывает факты. Низкая уверенность → confidence.* низкий.
 *
 * Все AI-ответы проходят через эту схему (client.messages.parse + zodOutputFormat).
 * Никаких JSON.parse(rawString) без валидации.
 */

export const ANALYSIS_VERSION = "call-analysis-v1";

const Confidence = z.number().min(0).max(1);

const Participant = z.object({
  role: z.enum(["MANAGER", "CLIENT", "UNKNOWN"]),
  name: z.string().nullable(),
  position: z.string().nullable(),
  decisionInfluence: z
    .enum(["decision_maker", "influencer", "initiator", "technical", "unknown"])
    .nullable(),
});

const Product = z.object({
  slug: z.string(), // greenery | cemetery | forestry | housing | digital_twin | ...
  name: z.string(),
  confidence: Confidence,
});

const DecisionMaker = z.object({
  found: z.boolean(),
  name: z.string().nullable(),
  position: z.string().nullable(),
  influence: z.enum(["high", "medium", "low", "unknown"]).nullable(),
  participatesInDecision: z.boolean().nullable(),
});

const Budget = z.object({
  discussed: z.boolean(),
  amount: z.number().nullable(),
  range: z.string().nullable(),
  source: z.string().nullable(), // источник финансирования
  hasFunding: z.boolean().nullable(),
});

const Timeline = z.object({
  discussed: z.boolean(),
  projectDeadline: z.string().nullable(),
  plannedYear: z.number().int().nullable(),
  quarter: z.string().nullable(),
  urgency: z.enum(["high", "medium", "low"]).nullable(),
});

const Procurement = z.object({
  mentioned: z.boolean(),
  // 44-ФЗ / 223-ФЗ / тендер / конкурс / аукцион / план закупок / контракт ...
  signals: z.array(z.string()),
  law: z.enum(["44-FZ", "223-FZ", "other", "none"]).nullable(),
  note: z.string().nullable(),
});

const Objection = z.object({
  text: z.string(),
  raisedBy: z.enum(["CLIENT", "MANAGER", "UNKNOWN"]),
  handled: z.boolean(),
  managerResponse: z.string().nullable(),
  responseQuality: z.enum(["good", "average", "poor"]).nullable(),
  recommendation: z.string().nullable(),
});

const Competitor = z.object({
  name: z.string(),
  context: z.string().nullable(),
  whyCompared: z.string().nullable(),
  theirStrengths: z.array(z.string()),
  theirWeaknesses: z.array(z.string()),
});

const Commitment = z.object({
  action: z.string(),
  by: z.enum(["MANAGER", "CLIENT"]),
  deadline: z.string().nullable(), // ISO или описание («завтра»)
});

const NextStep = z.object({
  exists: z.boolean(),
  action: z.string().nullable(),
  owner: z.enum(["MANAGER", "CLIENT", "UNKNOWN"]).nullable(),
  deadline: z.string().nullable(),
});

const Risk = z.object({
  type: z.string(), // no_budget | no_next_step | competitor | price_objection | stalled | ...
  detail: z.string(),
});

const Tag = z.object({
  slug: z.string(), // category:value, напр. sales:hot_lead
  confidence: Confidence,
});

const DealScoreFactor = z.object({
  factor: z.string(), // need | decision_maker | budget | timeline | procurement | ...
  points: z.number(), // может быть отрицательным
  reason: z.string(),
});

const DealScore = z.object({
  score: z.number().int().min(0).max(100),
  temperature: z.enum(["HOT", "WARM", "COLD"]),
  factors: z.array(DealScoreFactor), // объяснимость: почему такой балл
});

// Оценка менеджера по 13 критериям (§23 ТЗ), каждый 0..10.
const ManagerCriterion = z.object({
  key: z.enum([
    "opening",
    "discovery",
    "questions",
    "pain_identification",
    "current_situation",
    "decision_maker",
    "budget",
    "timeline",
    "procurement",
    "objections",
    "product_presentation",
    "next_step",
    "follow_up",
  ]),
  score: z.number().min(0).max(10),
  comment: z.string().nullable(),
});

const ManagerPerformance = z.object({
  overall: z.number().min(0).max(10),
  criteria: z.array(ManagerCriterion),
  didWell: z.array(z.string()),
  mistakes: z.array(z.string()),
  improveNextTime: z.array(z.string()),
  exampleBetterResponse: z.string().nullable(),
});

export const CallAnalysisSchema = z.object({
  summary: z.string(),

  result: z.object({
    type: z.enum([
      "agreed",
      "not_agreed",
      "callback",
      "meeting_set",
      "send_quote",
      "not_interested",
      "other",
    ]),
    confidence: Confidence,
  }),

  client: z.object({
    organizationType: z.string().nullable(),
    organizationName: z.string().nullable(),
    region: z.string().nullable(),
    industry: z.string().nullable(),
    currentProcess: z.string().nullable(),
    usedSystems: z.array(z.string()),
  }),

  participants: z.array(Participant),

  needs: z.array(z.string()),
  painPoints: z.array(z.string()), // реальные, из разговора; иначе []
  products: z.array(Product),
  currentSolution: z.array(z.string()),

  decisionMaker: DecisionMaker,
  budget: Budget,
  timeline: Timeline,
  procurement: Procurement,

  competitors: z.array(Competitor),
  objections: z.array(Objection),
  commitments: z.array(Commitment),

  nextStep: NextStep,
  risks: z.array(Risk),
  tags: z.array(Tag),

  dealScore: DealScore,
  managerPerformance: ManagerPerformance,

  confidence: z.object({
    overall: Confidence,
    dealScore: Confidence,
    product: Confidence,
    decisionMaker: Confidence,
  }),
});

export type CallAnalysis = z.infer<typeof CallAnalysisSchema>;
