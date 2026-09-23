import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

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
