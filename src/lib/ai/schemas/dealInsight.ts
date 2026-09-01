// zod/v4 — совместимо с zodOutputFormat (Claude) и safeParse (YandexGPT).
import * as z from "zod/v4";

/**
 * Холистический разбор СДЕЛКИ по всей истории звонков (§21,§33,§36 ТЗ).
 * Толерантная схема (catch/defaults), как callAnalysis.
 */
export const DEAL_INSIGHT_VERSION = "deal-insight-v1";

const nstr = z.string().nullable().catch(null);
const str = z.string().catch("");
const strArr = z.array(z.string()).catch([]);

const Factor = z
  .object({ factor: str, points: z.number().catch(0), reason: str })
  .catch({ factor: "", points: 0, reason: "" });

const Risk = z.object({ type: str, detail: str }).catch({ type: "", detail: "" });

export const DealInsightSchema = z.object({
  summary: str, // сводка всего хода сделки

  dealScore: z
    .object({
      score: z.number().int().catch(0),
      temperature: z.enum(["HOT", "WARM", "COLD"]).catch("COLD"),
      factors: z.array(Factor).catch([]),
    })
    .catch({ score: 0, temperature: "COLD", factors: [] }),

  // Оценка менеджера по сделке ЦЕЛИКОМ (по показательным звонкам, а не среднее по всем).
  managerAssessment: z
    .object({
      overall: z.number().nullable().catch(null), // 0..10, null если оценивать нечего
      strengths: strArr,
      weaknesses: strArr,
      coaching: strArr, // что улучшить по сделке
    })
    .catch({ overall: null, strengths: [], weaknesses: [], coaching: [] }),

  nextBestAction: str, // что менеджеру сделать дальше по сделке
  risks: z.array(Risk).catch([]),

  keyFacts: z
    .object({
      budget: nstr,
      timeline: nstr,
      decisionMaker: nstr,
      products: strArr,
      currentSolution: nstr,
    })
    .catch({ budget: null, timeline: null, decisionMaker: null, products: [], currentSolution: null }),

  stageRecommendation: nstr, // рекомендация по стадии («перевести в …»)
});

export type DealInsight = z.infer<typeof DealInsightSchema>;
