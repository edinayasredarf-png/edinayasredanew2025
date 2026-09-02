import "server-only";

import { createHash } from "node:crypto";
import { getAiProvider } from "@/lib/ai";
import { DealInsightSchema, DEAL_INSIGHT_VERSION } from "@/lib/ai/schemas/dealInsight";
import {
  DEAL_INSIGHT_SYSTEM,
  DEAL_INSIGHT_PROMPT_VERSION,
  buildDealInsightUser,
} from "@/lib/ai/prompts/dealInsight";
import {
  getDealCallDigest,
  getDealInsightHash,
  saveDealInsight,
} from "@/lib/server/aiSales/dealsDb";
import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Агрегированный разбор сделки по всем звонкам (§21,§33 ТЗ). Оценка менеджера —
 * по показательным звонкам сделки, а не средним по всем (не тянется короткими).
 * Кэш по input_hash дайджеста звонков: если звонки не менялись — LLM не гоняем.
 */

async function loadDealContext(bitrixDealId: string): Promise<{ companyTitle: string | null; dealTitle: string | null }> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ title: string | null; company_title: string | null }>(
    `select d.title, co.title as company_title
       from ai_deals d left join ai_companies co on co.bitrix_company_id = d.bitrix_company_id
      where d.bitrix_deal_id = $1`,
    [bitrixDealId]
  );
  return { dealTitle: rows[0]?.title ?? null, companyTitle: rows[0]?.company_title ?? null };
}

export interface DealAnalyzeOptions {
  force?: boolean;
}

export async function runDealInsight(
  bitrixDealId: string,
  opts: DealAnalyzeOptions = {}
): Promise<unknown> {
  const digest = await getDealCallDigest(bitrixDealId);
  if (!digest.items.length) return { skipped: "no analyzed calls" };

  const provider = await getAiProvider();
  const model = provider.defaultModel;

  // Хэш дайджеста → кэш. Меняются звонки/оценки → меняется хэш → пересчёт.
  const digestKey = JSON.stringify(
    digest.items.map((c) => [c.date, c.callType, c.connected, c.managerScoreApplicable, c.managerScore, c.dealScore, c.temperature, c.summary])
  );
  const inputHash = createHash("sha256")
    .update(`${DEAL_INSIGHT_PROMPT_VERSION}|${model}|${digestKey}`)
    .digest("hex");

  if (!opts.force && (await getDealInsightHash(bitrixDealId)) === inputHash) {
    return { cached: true };
  }

  const ctx = await loadDealContext(bitrixDealId);
  const { data } = await provider.generateStructured({
    schema: DealInsightSchema,
    system: DEAL_INSIGHT_SYSTEM,
    user: buildDealInsightUser(digest.items, ctx),
    maxTokens: 8000,
  });

  // Итоговая оценка менеджера по сделке: приоритет — холистическая оценка LLM;
  // если её нет — код-агрегат (среднее по показательным звонкам).
  const managerScore = data.managerAssessment.overall ?? digest.managerScoreAvg;

  await saveDealInsight({
    bitrixDealId,
    callsCount: digest.callsCount,
    scoredCalls: digest.scoredCalls,
    managerScore,
    provider: provider.name,
    model,
    promptVersion: DEAL_INSIGHT_PROMPT_VERSION,
    inputHash,
    data,
    lastCallAt: digest.lastCallAt,
  });

  return {
    analyzed: true,
    calls: digest.callsCount,
    scoredCalls: digest.scoredCalls,
    dealScore: data.dealScore.score,
    temperature: data.dealScore.temperature,
    managerScore,
    version: DEAL_INSIGHT_VERSION,
  };
}
