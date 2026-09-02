import "server-only";

/**
 * AI-РОП: сводный отчёт по отделу (§33-34 ТЗ). Композиция готовых движков —
 * дашборд, insights, менеджеры, рекомендации, follow-ups. Без LLM (§45).
 */
import { getDashboard } from "@/lib/server/aiSales/readDb";
import { getInsights, CRITERION_LABEL } from "@/lib/server/aiSales/insightsDb";
import { listManagers } from "@/lib/server/aiSales/managersDb";
import { getDailyRecommendations, type RecoItem } from "@/lib/server/aiSales/recommendationsDb";
import { listFollowUps } from "@/lib/server/aiSales/followupsDb";

interface DateRange { from?: string | null; to?: string | null }

export interface RopReport {
  dept: {
    calls: number; analyzed: number;
    avgDealScore: number | null; avgManagerScore: number | null;
    hot: number; warm: number; cold: number; withoutNextStep: number;
  };
  headlines: string[];
  bestManager: { name: string | null; score: number } | null;
  needsCoaching: { name: string | null; score: number } | null;
  weakestArea: string | null;
  attention: { criticalCount: number; riskCount: number; opportunityCount: number; items: RecoItem[] };
  overdueFollowups: number;
}

export async function getRopReport(
  managerBitrixId: string | null,
  range?: DateRange
): Promise<RopReport> {
  const [dash, insights, managers, reco, followups] = await Promise.all([
    getDashboard(managerBitrixId, range),
    getInsights(managerBitrixId, range),
    listManagers(range),
    getDailyRecommendations(managerBitrixId, range),
    listFollowUps({ managerBitrixId }),
  ]);

  const scored = managers.filter((m) => m.avgManagerScore != null && m.deals > 0);
  const best = scored.length
    ? scored.reduce((a, b) => ((b.avgManagerScore as number) > (a.avgManagerScore as number) ? b : a))
    : null;
  const worst = scored.length
    ? scored.reduce((a, b) => ((b.avgManagerScore as number) < (a.avgManagerScore as number) ? b : a))
    : null;

  const weakCrit = insights.managerWeakCriteria[0];
  const weakestArea = weakCrit ? (CRITERION_LABEL[weakCrit.key] || weakCrit.key) : null;

  return {
    dept: {
      calls: dash.calls.total,
      analyzed: dash.calls.analyzed,
      avgDealScore: dash.calls.avgDealScore,
      avgManagerScore: dash.calls.avgManagerScore,
      hot: dash.temperature.hot,
      warm: dash.temperature.warm,
      cold: dash.temperature.cold,
      withoutNextStep: dash.attention.withoutNextStep,
    },
    headlines: insights.headlines,
    bestManager: best ? { name: best.name, score: best.avgManagerScore as number } : null,
    needsCoaching: worst && worst.bitrixUserId !== best?.bitrixUserId
      ? { name: worst.name, score: worst.avgManagerScore as number }
      : null,
    weakestArea,
    attention: {
      criticalCount: reco.counts.critical,
      riskCount: reco.counts.risk,
      opportunityCount: reco.counts.opportunity,
      items: reco.critical.slice(0, 8),
    },
    overdueFollowups: followups.overdueCount,
  };
}
