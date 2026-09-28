import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { resolveDealStage, resolveLeadStage, type ResolvedStage } from "@/lib/server/bitrix/dealStages";

/**
 * Резолвить этап звонка (лид/сделка) — общая логика для analysisService.ts
 * (речевая аналитика) и scriptScoreService.ts (оценка соблюдения скрипта),
 * чтобы обе оценки видели один и тот же этап одинаковым способом. Пока
 * сделки нет — берём этап лида; после конвертации — этап сделки.
 */
export async function resolveCallStage(call: {
  bitrix_deal_id: string | null;
  bitrix_lead_id: string | null;
}): Promise<ResolvedStage> {
  if (call.bitrix_deal_id) {
    const pool = getTimewebPool();
    const { rows } = await pool.query<{ stage_id: string | null }>(
      `select stage_id from ai_deals where bitrix_deal_id = $1`,
      [call.bitrix_deal_id]
    );
    return resolveDealStage(rows[0]?.stage_id ?? null);
  }
  if (call.bitrix_lead_id) {
    const pool = getTimewebPool();
    const { rows } = await pool.query<{ status_id: string | null }>(
      `select status_id from ai_leads where bitrix_lead_id = $1`,
      [call.bitrix_lead_id]
    );
    return resolveLeadStage(rows[0]?.status_id ?? null);
  }
  return resolveDealStage(null);
}
