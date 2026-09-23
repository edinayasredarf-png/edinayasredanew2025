import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

/**
 * Табличные отчёты по чек-листам (как в референсе): матрица «менеджер × шаги
 * скрипта». Всё обычным SQL (§45). Берём ПОСЛЕДНЮЮ оценку скрипта по каждому
 * звонку (re-score не задваивает), разворачиваем шаги и считаем % выполнения.
 */

interface DateRange { from?: string | null; to?: string | null }

export interface StepCol { key: string; title: string }
export interface StepCell { completed: number; total: number; pct: number | null }
export interface ManagerRowM {
  bitrixUserId: string;
  name: string | null;
  calls: number;
  avgScore: number | null;
  cells: Record<string, StepCell>;
}
export interface ScriptStepMatrix {
  steps: StepCol[];
  managers: ManagerRowM[];
}

function rangeSql(range: DateRange | undefined, params: unknown[]): string {
  let sql = "";
  if (range?.from) { params.push(range.from); sql += ` and c.started_at >= $${params.length}::date`; }
  if (range?.to) { params.push(range.to); sql += ` and c.started_at < ($${params.length}::date + interval '1 day')`; }
  return sql;
}

/** Матрица «менеджер × шаги скрипта»: % выполнения по каждому шагу + средний балл. */
export async function getScriptStepMatrix(range?: DateRange): Promise<ScriptStepMatrix> {
  const pool = getTimewebPool();

  // Итоги по менеджеру: число звонков (с оценкой скрипта) и средний балл.
  const totalsParams: unknown[] = [];
  const totalsSql = `
    with latest as (
      select distinct on (ss.call_id) ss.call_id, ss.score, ss.steps
        from ai_call_script_scores ss
        order by ss.call_id, ss.created_at desc
    )
    select c.bitrix_user_id uid, m.full_name name,
           count(*)::text calls, round(avg(l.score), 1)::text avg_score
      from latest l
      join ai_calls c on c.id = l.call_id
      left join ai_managers m on m.bitrix_user_id = c.bitrix_user_id
     where c.bitrix_user_id is not null${rangeSql(range, totalsParams)}
     group by 1, 2`;
  const totals = await pool.query<{ uid: string; name: string | null; calls: string; avg_score: string | null }>(totalsSql, totalsParams);

  // По шагам: выполнено/всего на менеджера и шаг.
  const stepsParams: unknown[] = [];
  const stepsSql = `
    with latest as (
      select distinct on (ss.call_id) ss.call_id, ss.steps
        from ai_call_script_scores ss
        order by ss.call_id, ss.created_at desc
    )
    select c.bitrix_user_id uid,
           st->>'key' key, max(st->>'title') title,
           count(*) filter (where (st->>'completed') = 'true')::text completed,
           count(*)::text total
      from latest l
      join ai_calls c on c.id = l.call_id
      cross join lateral jsonb_array_elements(l.steps) st
     where c.bitrix_user_id is not null and coalesce(st->>'key','') <> ''${rangeSql(range, stepsParams)}
     group by 1, 2`;
  const stepRows = await pool.query<{ uid: string; key: string; title: string | null; completed: string; total: string }>(stepsSql, stepsParams);

  // Колонки-шаги: по суммарной частоте (самые массовые — левее).
  const stepAgg = new Map<string, { title: string; total: number }>();
  for (const r of stepRows.rows) {
    const cur = stepAgg.get(r.key) || { title: r.title || r.key, total: 0 };
    cur.total += Number(r.total);
    if (r.title) cur.title = r.title;
    stepAgg.set(r.key, cur);
  }
  const steps: StepCol[] = [...stepAgg.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([key, v]) => ({ key, title: v.title }));

  const cellsByUid = new Map<string, Record<string, StepCell>>();
  for (const r of stepRows.rows) {
    const m = cellsByUid.get(r.uid) || {};
    const completed = Number(r.completed);
    const total = Number(r.total);
    m[r.key] = { completed, total, pct: total ? Math.round((completed / total) * 100) : null };
    cellsByUid.set(r.uid, m);
  }

  const managers: ManagerRowM[] = totals.rows
    .map((r) => ({
      bitrixUserId: r.uid,
      name: r.name,
      calls: Number(r.calls),
      avgScore: r.avg_score != null ? Number(r.avg_score) : null,
      cells: cellsByUid.get(r.uid) || {},
    }))
    .sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1) || b.calls - a.calls);

  return { steps, managers };
}

/* ─── Провал по ячейке: звонки, где менеджер выполнил/провалил шаг ─── */

export interface StepCall {
  callId: string;
  startedAt: string | null;
  clientTitle: string | null;
  dealUrl: string | null;
  score: number | null;
}

export async function getStepCalls(
  bitrixUserId: string,
  stepKey: string,
  completed: boolean,
  range?: DateRange
): Promise<StepCall[]> {
  if (!bitrixUserId || !stepKey) return [];
  const pool = getTimewebPool();
  const params: unknown[] = [bitrixUserId, stepKey, completed];
  const rSql = rangeSql(range, params);
  const { rows } = await pool.query<{ call_id: string; started_at: Date | null; client_title: string | null; bitrix_deal_id: string | null; score: number | null }>(
    `with latest as (
       select distinct on (ss.call_id) ss.call_id, ss.score, ss.steps
         from ai_call_script_scores ss
         order by ss.call_id, ss.created_at desc
     )
     select c.id call_id, c.started_at, c.client_title, c.bitrix_deal_id, l.score
       from latest l
       join ai_calls c on c.id = l.call_id
      where c.bitrix_user_id = $1${rSql}
        and exists (
          select 1 from jsonb_array_elements(l.steps) st
           where st->>'key' = $2 and ((st->>'completed') = 'true') = $3
        )
      order by c.started_at desc
      limit 100`,
    params
  );
  const origin = bitrixPortalOrigin();
  return rows.map((r) => ({
    callId: r.call_id,
    startedAt: r.started_at ? r.started_at.toISOString() : null,
    clientTitle: r.client_title,
    dealUrl: r.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
    score: r.score,
  }));
}

/* ─── Конверсия: менеджер × результаты звонков ─── */

export interface ConvCell { count: number; pct: number | null }
export interface ConvRow {
  bitrixUserId: string;
  name: string | null;
  calls: number;
  cells: Record<string, ConvCell>;
}
export interface ConversionMatrix {
  results: string[]; // типы результатов в порядке приоритета
  managers: ConvRow[];
}

// Порядок колонок результатов (воронка → отказ).
const RESULT_ORDER = ["agreed", "meeting_set", "send_quote", "callback", "not_agreed", "not_interested", "no_contact", "other"];

export async function getConversionMatrix(range?: DateRange): Promise<ConversionMatrix> {
  const pool = getTimewebPool();
  const params: unknown[] = [];
  const rSql = rangeSql(range, params);
  const { rows } = await pool.query<{ uid: string; name: string | null; result_type: string | null; n: string }>(
    `with latest as (
       select distinct on (a.call_id) a.call_id, a.result_type
         from ai_call_analysis a
         order by a.call_id, a.created_at desc
     )
     select c.bitrix_user_id uid, m.full_name name,
            coalesce(l.result_type, 'other') result_type, count(*)::text n
       from latest l
       join ai_calls c on c.id = l.call_id
       left join ai_managers m on m.bitrix_user_id = c.bitrix_user_id
      where c.bitrix_user_id is not null${rSql}
      group by 1, 2, 3`,
    params
  );

  const present = new Set<string>();
  const byUid = new Map<string, { name: string | null; calls: number; cells: Record<string, ConvCell> }>();
  for (const r of rows) {
    present.add(r.result_type || "other");
    const m = byUid.get(r.uid) || { name: r.name, calls: 0, cells: {} };
    const n = Number(r.n);
    m.calls += n;
    m.cells[r.result_type || "other"] = { count: n, pct: 0 };
    if (r.name) m.name = r.name;
    byUid.set(r.uid, m);
  }
  // Проценты от общего числа звонков менеджера.
  for (const m of byUid.values()) {
    for (const k of Object.keys(m.cells)) {
      m.cells[k].pct = m.calls ? Math.round((m.cells[k].count / m.calls) * 100) : null;
    }
  }

  const results = RESULT_ORDER.filter((t) => present.has(t));
  const managers: ConvRow[] = [...byUid.entries()]
    .map(([uid, v]) => ({ bitrixUserId: uid, name: v.name, calls: v.calls, cells: v.cells }))
    .sort((a, b) => b.calls - a.calls);

  return { results, managers };
}

/* ─── Возражения по менеджерам ─── */

export interface ObjectionRowM {
  bitrixUserId: string;
  name: string | null;
  callsWithObj: number;
  total: number;
  unhandled: number;
  handledPct: number | null;
}

export async function getObjectionsByManager(range?: DateRange): Promise<ObjectionRowM[]> {
  const pool = getTimewebPool();
  const params: unknown[] = [];
  const rSql = rangeSql(range, params);
  const { rows } = await pool.query<{ uid: string; name: string | null; total: string; unhandled: string; calls_with_obj: string }>(
    `with latest as (
       select distinct on (a.call_id) a.call_id, a.data
         from ai_call_analysis a
         order by a.call_id, a.created_at desc
     )
     select c.bitrix_user_id uid, m.full_name name,
            count(*)::text total,
            count(*) filter (where (o->>'handled') = 'false')::text unhandled,
            count(distinct l.call_id)::text calls_with_obj
       from latest l
       join ai_calls c on c.id = l.call_id
       left join ai_managers m on m.bitrix_user_id = c.bitrix_user_id
       cross join lateral jsonb_array_elements(l.data->'objections') o
      where c.bitrix_user_id is not null and coalesce(trim(o->>'text'), '') <> ''${rSql}
      group by 1, 2`,
    params
  );
  return rows
    .map((r) => {
      const total = Number(r.total);
      const unhandled = Number(r.unhandled);
      return {
        bitrixUserId: r.uid,
        name: r.name,
        callsWithObj: Number(r.calls_with_obj),
        total,
        unhandled,
        handledPct: total ? Math.round(((total - unhandled) / total) * 100) : null,
      };
    })
    .sort((a, b) => b.unhandled - a.unhandled || b.total - a.total);
}

export interface ObjectionCall {
  callId: string;
  startedAt: string | null;
  clientTitle: string | null;
  dealUrl: string | null;
  objections: Array<{ text: string; handled: boolean; recommendation: string | null }>;
}

export async function getObjectionCalls(
  bitrixUserId: string,
  onlyUnhandled: boolean,
  range?: DateRange
): Promise<ObjectionCall[]> {
  if (!bitrixUserId) return [];
  const pool = getTimewebPool();
  const params: unknown[] = [bitrixUserId];
  const rSql = rangeSql(range, params);
  const { rows } = await pool.query<{ call_id: string; started_at: Date | null; client_title: string | null; bitrix_deal_id: string | null; objections: unknown }>(
    `with latest as (
       select distinct on (a.call_id) a.call_id, a.data
         from ai_call_analysis a
         order by a.call_id, a.created_at desc
     )
     select c.id call_id, c.started_at, c.client_title, c.bitrix_deal_id, l.data->'objections' objections
       from latest l
       join ai_calls c on c.id = l.call_id
      where c.bitrix_user_id = $1${rSql}
        and exists (
          select 1 from jsonb_array_elements(l.data->'objections') o
           where coalesce(trim(o->>'text'), '') <> ''${onlyUnhandled ? " and (o->>'handled') = 'false'" : ""}
        )
      order by c.started_at desc
      limit 100`,
    params
  );
  const origin = bitrixPortalOrigin();
  return rows.map((r) => {
    const raw = Array.isArray(r.objections) ? (r.objections as Array<Record<string, unknown>>) : [];
    const objections = raw
      .filter((o) => String(o.text || "").trim() && (!onlyUnhandled || o.handled === false))
      .map((o) => ({ text: String(o.text || "").trim(), handled: o.handled === true, recommendation: o.recommendation ? String(o.recommendation) : null }));
    return {
      callId: r.call_id,
      startedAt: r.started_at ? r.started_at.toISOString() : null,
      clientTitle: r.client_title,
      dealUrl: r.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
      objections,
    };
  });
}
