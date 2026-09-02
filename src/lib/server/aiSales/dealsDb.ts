import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";
import type { DealInsight } from "@/lib/ai/schemas/dealInsight";
import type { DealCallDigestItem } from "@/lib/ai/prompts/dealInsight";

/** Разбор звонков сделки (последний анализ по каждому звонку) + код-агрегаты. */
export interface DealCallDigest {
  items: DealCallDigestItem[];
  callsCount: number;
  scoredCalls: number;
  /** Средняя оценка менеджера по показательным состоявшимся звонкам (или null). */
  managerScoreAvg: number | null;
  lastCallAt: string | null;
}

export async function getDealCallDigest(bitrixDealId: string): Promise<DealCallDigest> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{
    started_at: Date | null;
    summary: string | null;
    deal_score: number | null;
    deal_temperature: string | null;
    manager_score: string | null;
    call_type: string | null;
    connected: string | null;
    msa: string | null;
  }>(
    `select started_at, summary, deal_score, deal_temperature, manager_score, call_type, connected, msa
       from (
         select distinct on (c.id)
                c.id, c.started_at,
                a.summary, a.deal_score, a.deal_temperature, a.manager_score,
                a.data->>'callType' as call_type,
                a.data->>'connected' as connected,
                a.data->>'managerScoreApplicable' as msa,
                a.created_at
           from ai_calls c
           join ai_call_analysis a on a.call_id = c.id
          where c.bitrix_deal_id = $1
          order by c.id, a.created_at desc
       ) latest
      order by started_at asc nulls last`,
    [bitrixDealId]
  );

  const items: DealCallDigestItem[] = rows.map((r) => ({
    date: r.started_at ? r.started_at.toISOString() : null,
    callType: r.call_type || "other",
    connected: r.connected !== "false",
    managerScoreApplicable: r.msa !== "false",
    managerScore: r.manager_score != null ? Number(r.manager_score) : null,
    dealScore: r.deal_score,
    temperature: r.deal_temperature,
    summary: (r.summary || "").trim(),
  }));

  const scored = items.filter((i) => i.connected && i.managerScoreApplicable && i.managerScore != null);
  const managerScoreAvg = scored.length
    ? Number((scored.reduce((s, i) => s + (i.managerScore as number), 0) / scored.length).toFixed(1))
    : null;
  const lastCallAt = items.length ? items[items.length - 1].date : null;

  return {
    items,
    callsCount: items.length,
    scoredCalls: scored.length,
    managerScoreAvg,
    lastCallAt,
  };
}

export async function saveDealInsight(input: {
  bitrixDealId: string;
  callsCount: number;
  scoredCalls: number;
  managerScore: number | null;
  provider: string;
  model: string;
  promptVersion: string;
  inputHash: string;
  data: DealInsight;
  lastCallAt: string | null;
}): Promise<void> {
  const pool = getTimewebPool();
  const d = input.data;
  await pool.query(
    `insert into ai_deal_insights (
       bitrix_deal_id, calls_count, scored_calls, deal_score, deal_temperature, manager_score,
       next_action, summary, provider, model, prompt_version, input_hash, data, last_call_at, updated_at
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14, now())
     on conflict (bitrix_deal_id) do update set
       calls_count = excluded.calls_count,
       scored_calls = excluded.scored_calls,
       deal_score = excluded.deal_score,
       deal_temperature = excluded.deal_temperature,
       manager_score = excluded.manager_score,
       next_action = excluded.next_action,
       summary = excluded.summary,
       provider = excluded.provider,
       model = excluded.model,
       prompt_version = excluded.prompt_version,
       input_hash = excluded.input_hash,
       data = excluded.data,
       last_call_at = excluded.last_call_at,
       updated_at = now()`,
    [
      input.bitrixDealId, input.callsCount, input.scoredCalls,
      d.dealScore.score, d.dealScore.temperature, input.managerScore,
      d.nextBestAction || null, d.summary, input.provider, input.model, input.promptVersion,
      input.inputHash, JSON.stringify(d), input.lastCallAt,
    ]
  );
}

export async function getDealInsightHash(bitrixDealId: string): Promise<string | null> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ input_hash: string | null }>(
    `select input_hash from ai_deal_insights where bitrix_deal_id = $1`,
    [bitrixDealId]
  );
  return rows[0]?.input_hash ?? null;
}

/* ── Выборки для UI ── */

export interface DealListItem {
  bitrixDealId: string;
  title: string | null;
  companyTitle: string | null;
  managerName: string | null;
  dealUrl: string | null;
  callsCount: number;
  scoredCalls: number;
  dealScore: number | null;
  temperature: string | null;
  managerScore: number | null;
  nextAction: string | null;
  lastCallAt: string | null;
}

export async function listDeals(f: {
  managerBitrixId?: string | null;
  temperature?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{ items: DealListItem[]; total: number }> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();
  const where: string[] = ["true"];
  const params: unknown[] = [];
  let i = 1;
  if (f.managerBitrixId) { where.push(`d.bitrix_user_id = $${i++}`); params.push(f.managerBitrixId); }
  if (f.temperature) { where.push(`di.deal_temperature = $${i++}`); params.push(f.temperature); }
  if (f.from) { where.push(`di.last_call_at >= $${i++}::date`); params.push(f.from); }
  if (f.to) { where.push(`di.last_call_at < ($${i++}::date + interval '1 day')`); params.push(f.to); }
  const whereSql = where.join(" and ");
  const limit = Math.min(f.limit ?? 50, 200);
  const offset = f.offset ?? 0;

  const totalRes = await pool.query<{ n: string }>(
    `select count(*)::text n from ai_deal_insights di
       join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id
      where ${whereSql}`,
    params
  );

  const rows = await pool.query<{
    bitrix_deal_id: string; title: string | null; company_title: string | null; manager_name: string | null;
    calls_count: number; scored_calls: number; deal_score: number | null; deal_temperature: string | null;
    manager_score: string | null; next_action: string | null; last_call_at: Date | null;
  }>(
    `select di.bitrix_deal_id, d.title, co.title as company_title, m.full_name as manager_name,
            di.calls_count, di.scored_calls, di.deal_score, di.deal_temperature,
            di.manager_score, di.next_action, di.last_call_at
       from ai_deal_insights di
       join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id
       left join ai_companies co on co.bitrix_company_id = d.bitrix_company_id
       left join ai_managers m on m.bitrix_user_id = d.bitrix_user_id
      where ${whereSql}
      order by di.deal_temperature = 'HOT' desc, di.deal_score desc nulls last, di.last_call_at desc nulls last
      limit ${limit} offset ${offset}`,
    params
  );

  return {
    total: Number(totalRes.rows[0]?.n ?? 0),
    items: rows.rows.map((r) => ({
      bitrixDealId: r.bitrix_deal_id,
      title: r.title,
      companyTitle: r.company_title,
      managerName: r.manager_name,
      dealUrl: origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
      callsCount: r.calls_count,
      scoredCalls: r.scored_calls,
      dealScore: r.deal_score,
      temperature: r.deal_temperature,
      managerScore: r.manager_score != null ? Number(r.manager_score) : null,
      nextAction: r.next_action,
      lastCallAt: r.last_call_at ? r.last_call_at.toISOString() : null,
    })),
  };
}

export interface DealDetailData {
  deal: {
    bitrixDealId: string;
    title: string | null;
    companyTitle: string | null;
    managerName: string | null;
    dealUrl: string | null;
  };
  insight: Record<string, unknown> | null;
  managerScore: number | null;
  calls: Array<{
    id: string;
    startedAt: string | null;
    callType: string | null;
    status: string;
    dealScore: number | null;
    managerScore: number | null;
    temperature: string | null;
  }>;
}

export async function getDealDetail(bitrixDealId: string): Promise<DealDetailData | null> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();

  const dr = await pool.query<{
    bitrix_deal_id: string; title: string | null; company_title: string | null; manager_name: string | null;
  }>(
    `select d.bitrix_deal_id, d.title, co.title as company_title, m.full_name as manager_name
       from ai_deals d
       left join ai_companies co on co.bitrix_company_id = d.bitrix_company_id
       left join ai_managers m on m.bitrix_user_id = d.bitrix_user_id
      where d.bitrix_deal_id = $1`,
    [bitrixDealId]
  );
  const deal = dr.rows[0];
  if (!deal) return null;

  const ir = await pool.query<{ data: Record<string, unknown>; manager_score: string | null }>(
    `select data, manager_score from ai_deal_insights where bitrix_deal_id = $1`,
    [bitrixDealId]
  );

  const cr = await pool.query<{
    id: string; started_at: Date | null; status: string;
    deal_score: number | null; manager_score: string | null; deal_temperature: string | null; call_type: string | null;
  }>(
    `select c.id, c.started_at, c.status, a.deal_score, a.manager_score, a.deal_temperature,
            a.data->>'callType' as call_type
       from ai_calls c
       left join lateral (
         select * from ai_call_analysis aa where aa.call_id = c.id order by aa.created_at desc limit 1
       ) a on true
      where c.bitrix_deal_id = $1
      order by c.started_at desc nulls last`,
    [bitrixDealId]
  );

  return {
    deal: {
      bitrixDealId: deal.bitrix_deal_id,
      title: deal.title,
      companyTitle: deal.company_title,
      managerName: deal.manager_name,
      dealUrl: origin ? `${origin}/crm/deal/details/${deal.bitrix_deal_id}/` : null,
    },
    insight: ir.rows[0]?.data ?? null,
    managerScore: ir.rows[0]?.manager_score != null ? Number(ir.rows[0].manager_score) : null,
    calls: cr.rows.map((r) => ({
      id: r.id,
      startedAt: r.started_at ? r.started_at.toISOString() : null,
      callType: r.call_type,
      status: r.status,
      dealScore: r.deal_score,
      managerScore: r.manager_score != null ? Number(r.manager_score) : null,
      temperature: r.deal_temperature,
    })),
  };
}
