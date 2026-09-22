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
  partial: boolean;         // текущая (неполная) неделя — не учитывается в сравнении
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

  const curWeekStart = rows.rows.length ? rows.rows[rows.rows.length - 1].wk.getTime() : 0;
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
  const weekly: TrendPoint[] = rows.rows.map((r) => ({
    week: r.wk.toISOString().slice(0, 10),
    label: fmt(r.wk),
    calls: Number(r.calls),
    analyzed: Number(r.analyzed),
    avgDealScore: round(r.avg_deal),
    avgManagerScore: round(mgrByWeek.get(r.wk.getTime()) ?? null),
    hot: Number(r.hot),
    partial: r.wk.getTime() === curWeekStart, // последняя неделя — неполная
  }));

  const delta = await getPeriodDelta(managerBitrixId);
  return { weekly, delta };
}

/**
 * Сравнение периода к периоду по ЗАВЕРШЁННЫМ неделям (текущая неполная неделя
 * исключена): последние 6 полных недель против предыдущих 6. Средние берём прямо
 * из SQL — они естественно взвешены по объёму (avg по всем строкам окна), а не
 * «среднее из недельных средних».
 */
async function getPeriodDelta(managerBitrixId: string | null): Promise<PeriodDelta> {
  const pool = getTimewebPool();
  const cMgr = managerBitrixId ? ` and c.bitrix_user_id = $1` : "";
  const cParams = managerBitrixId ? [managerBitrixId] : [];
  // Окна по звонкам: [now-12w, now-6w) — прошлый; [now-6w, now-0w) без текущей недели.
  const callsAgg = await pool.query<{
    calls_cur: string; calls_prev: string; hot_cur: string; hot_prev: string;
    deal_cur: string | null; deal_prev: string | null;
  }>(
    `with b as (
       select date_trunc('week', now()) as cur_wk,
              date_trunc('week', now()) - interval '6 weeks' as cur_from,
              date_trunc('week', now()) - interval '12 weeks' as prev_from
     )
     select
       count(c.id) filter (where c.started_at >= b.cur_from and c.started_at < b.cur_wk)::text as calls_cur,
       count(c.id) filter (where c.started_at >= b.prev_from and c.started_at < b.cur_from)::text as calls_prev,
       count(*) filter (where a.deal_temperature = 'HOT' and c.started_at >= b.cur_from and c.started_at < b.cur_wk)::text as hot_cur,
       count(*) filter (where a.deal_temperature = 'HOT' and c.started_at >= b.prev_from and c.started_at < b.cur_from)::text as hot_prev,
       avg(a.deal_score) filter (where c.started_at >= b.cur_from and c.started_at < b.cur_wk)::text as deal_cur,
       avg(a.deal_score) filter (where c.started_at >= b.prev_from and c.started_at < b.cur_from)::text as deal_prev
     from b
     left join ai_calls c on c.started_at >= b.prev_from and c.started_at < b.cur_wk${cMgr}
     left join ai_call_analysis a on a.call_id = c.id`,
    cParams
  );

  const dMgr = managerBitrixId ? ` and d.bitrix_user_id = $1` : "";
  const mgrAgg = await pool.query<{ mgr_cur: string | null; mgr_prev: string | null }>(
    `with b as (
       select date_trunc('week', now()) as cur_wk,
              date_trunc('week', now()) - interval '6 weeks' as cur_from,
              date_trunc('week', now()) - interval '12 weeks' as prev_from
     )
     select
       avg(di.manager_score) filter (where di.last_call_at >= b.cur_from and di.last_call_at < b.cur_wk)::text as mgr_cur,
       avg(di.manager_score) filter (where di.last_call_at >= b.prev_from and di.last_call_at < b.cur_from)::text as mgr_prev
     from b
     left join ai_deal_insights di on di.last_call_at >= b.prev_from and di.last_call_at < b.cur_wk
     left join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id${dMgr}`,
    cParams
  );

  const c = callsAgg.rows[0];
  const m = mgrAgg.rows[0];
  return {
    calls: Number(c?.calls_cur || 0), callsPrev: Number(c?.calls_prev || 0),
    hot: Number(c?.hot_cur || 0), hotPrev: Number(c?.hot_prev || 0),
    avgDealScore: round(c?.deal_cur ?? null), avgDealScorePrev: round(c?.deal_prev ?? null),
    avgManagerScore: round(m?.mgr_cur ?? null), avgManagerScorePrev: round(m?.mgr_prev ?? null),
  };
}
