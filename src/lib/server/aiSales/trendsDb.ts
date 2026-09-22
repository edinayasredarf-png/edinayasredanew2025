import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Динамика во времени (§45: агрегация SQL, не LLM). Недельные срезы ключевых
 * метрик + сравнение текущего периода с предыдущим равной длины — чтобы видеть
 * прогресс отдела/менеджера, а не только срез «за сегодня».
 */

export interface TrendPoint {
  week: string;             // ISO-дата понедельника недели
  label: string;            // «02.06» для оси
  calls: number;
  analyzed: number;
  avgDealScore: number | null;
  avgManagerScore: number | null;
  hot: number;
}

export interface PeriodDelta {
  calls: number; callsPrev: number;
  avgDealScore: number | null; avgDealScorePrev: number | null;
  avgManagerScore: number | null; avgManagerScorePrev: number | null;
  hot: number; hotPrev: number;
}

export interface TrendsResult {
  weekly: TrendPoint[];
  delta: PeriodDelta;
}

const round = (v: string | number | null, d = 1): number | null =>
  v == null ? null : Number(Number(v).toFixed(d));

/** Недельная динамика за N недель + сравнение периода к периоду. */
export async function getTrends(
  managerBitrixId: string | null,
  weeks = 12
): Promise<TrendsResult> {
  const pool = getTimewebPool();
  const wk = Math.max(4, Math.min(26, weeks));

  // Фильтр по менеджеру для звонков и для сделочных оценок.
  const cMgr = managerBitrixId ? ` and c.bitrix_user_id = $2` : "";
  const params: unknown[] = [wk];
  if (managerBitrixId) params.push(managerBitrixId);

  // Недельные срезы звонков/разборов.
  const rows = await pool.query<{
    wk: Date; calls: string; analyzed: string; avg_deal: string | null; hot: string;
  }>(
    `with weeks as (
       select generate_series(
         date_trunc('week', now()) - (($1::int - 1) * interval '1 week'),
         date_trunc('week', now()),
         interval '1 week'
       ) as wk
     )
     select w.wk,
            count(c.id)::text as calls,
            count(c.id) filter (where c.status = 'COMPLETED')::text as analyzed,
            avg(a.deal_score)::text as avg_deal,
            count(*) filter (where a.deal_temperature = 'HOT')::text as hot
       from weeks w
       left join ai_calls c
         on date_trunc('week', c.started_at) = w.wk${cMgr}
       left join ai_call_analysis a on a.call_id = c.id
      group by w.wk
      order by w.wk`,
    params
  );

  // Средняя оценка менеджера по неделям (по сделкам — как в дашборде).
  const dMgr = managerBitrixId ? ` and d.bitrix_user_id = $2` : "";
  const mgrRows = await pool.query<{ wk: Date; avg_mgr: string | null }>(
    `with weeks as (
       select generate_series(
         date_trunc('week', now()) - (($1::int - 1) * interval '1 week'),
         date_trunc('week', now()),
         interval '1 week'
       ) as wk
     )
     select w.wk, avg(di.manager_score)::text as avg_mgr
       from weeks w
       left join ai_deal_insights di on date_trunc('week', di.last_call_at) = w.wk
       left join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id${dMgr}
      group by w.wk order by w.wk`,
    params
  );
  const mgrByWeek = new Map<number, string | null>();
  for (const r of mgrRows.rows) mgrByWeek.set(r.wk.getTime(), r.avg_mgr);

  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  const weekly: TrendPoint[] = rows.rows.map((r) => ({
    week: r.wk.toISOString().slice(0, 10),
    label: fmt(r.wk),
    calls: Number(r.calls),
    analyzed: Number(r.analyzed),
    avgDealScore: round(r.avg_deal),
    avgManagerScore: round(mgrByWeek.get(r.wk.getTime()) ?? null),
    hot: Number(r.hot),
  }));

  // Период к периоду: последняя половина недель vs предыдущая половина.
  const half = Math.floor(weekly.length / 2);
  const prev = weekly.slice(0, half);
  const cur = weekly.slice(half);
  const sum = (a: TrendPoint[], k: "calls" | "hot") => a.reduce((n, p) => n + p[k], 0);
  const avg = (a: TrendPoint[], k: "avgDealScore" | "avgManagerScore"): number | null => {
    const vals = a.map((p) => p[k]).filter((v): v is number => v != null);
    return vals.length ? round(vals.reduce((n, v) => n + v, 0) / vals.length) : null;
  };

  const delta: PeriodDelta = {
    calls: sum(cur, "calls"), callsPrev: sum(prev, "calls"),
    hot: sum(cur, "hot"), hotPrev: sum(prev, "hot"),
    avgDealScore: avg(cur, "avgDealScore"), avgDealScorePrev: avg(prev, "avgDealScore"),
    avgManagerScore: avg(cur, "avgManagerScore"), avgManagerScorePrev: avg(prev, "avgManagerScore"),
  };

  return { weekly, delta };
}
