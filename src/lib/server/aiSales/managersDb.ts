import "server-only";

/**
 * Аналитика по менеджерам (§77-78 ТЗ). Список с перформансом + карточка менеджера.
 * Оценка менеджера — по СДЕЛКАМ (справедливо). Доступ — РОП/админ (§58).
 */
import { getTimewebPool } from "@/lib/timewebPg";

interface DateRange { from?: string | null; to?: string | null }

function callRange(range: DateRange | undefined, params: unknown[], alias = "c"): string {
  const parts: string[] = [];
  if (range?.from) { params.push(range.from); parts.push(`${alias}.started_at >= $${params.length}::date`); }
  if (range?.to) { params.push(range.to); parts.push(`${alias}.started_at < ($${params.length}::date + interval '1 day')`); }
  return parts.length ? ` and ${parts.join(" and ")}` : "";
}
function dealRange(range: DateRange | undefined, params: unknown[]): string {
  const parts: string[] = [];
  if (range?.from) { params.push(range.from); parts.push(`di.last_call_at >= $${params.length}::date`); }
  if (range?.to) { params.push(range.to); parts.push(`di.last_call_at < ($${params.length}::date + interval '1 day')`); }
  return parts.length ? ` and ${parts.join(" and ")}` : "";
}

export interface ManagerRow {
  bitrixUserId: string;
  name: string | null;
  calls: number;
  analyzed: number;
  deals: number;
  hotDeals: number;
  avgManagerScore: number | null;
  avgDealScore: number | null;
}

export async function listManagers(range?: DateRange): Promise<ManagerRow[]> {
  const pool = getTimewebPool();

  const callParams: unknown[] = [];
  const callAgg = await pool.query<{ uid: string; calls: string; analyzed: string }>(
    `select c.bitrix_user_id uid, count(*)::text calls,
            count(*) filter (where status='COMPLETED')::text analyzed
       from ai_calls c
      where c.bitrix_user_id is not null${callRange(range, callParams)}
      group by 1`,
    callParams
  );

  const dealParams: unknown[] = [];
  const dealAgg = await pool.query<{
    uid: string; avg_mgr: string | null; avg_deal: string | null; deals: string; hot: string;
  }>(
    `select d.bitrix_user_id uid,
            avg(di.manager_score)::text avg_mgr, avg(di.deal_score)::text avg_deal,
            count(*)::text deals, count(*) filter (where di.deal_temperature='HOT')::text hot
       from ai_deal_insights di
       join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id
      where d.bitrix_user_id is not null${dealRange(range, dealParams)}
      group by 1`,
    dealParams
  );

  const names = await pool.query<{ bitrix_user_id: string; full_name: string | null }>(
    `select bitrix_user_id, full_name from ai_managers`
  );
  const nameMap = new Map(names.rows.map((r) => [r.bitrix_user_id, r.full_name]));
  const dealMap = new Map(dealAgg.rows.map((r) => [r.uid, r]));

  const uids = new Set<string>([...callAgg.rows.map((r) => r.uid), ...dealAgg.rows.map((r) => r.uid)]);
  const round = (v: string | null | undefined, d = 1) => (v == null ? null : Number(Number(v).toFixed(d)));

  const rows: ManagerRow[] = [];
  for (const uid of uids) {
    const c = callAgg.rows.find((r) => r.uid === uid);
    const dl = dealMap.get(uid);
    rows.push({
      bitrixUserId: uid,
      name: nameMap.get(uid) ?? null,
      calls: Number(c?.calls ?? 0),
      analyzed: Number(c?.analyzed ?? 0),
      deals: Number(dl?.deals ?? 0),
      hotDeals: Number(dl?.hot ?? 0),
      avgManagerScore: round(dl?.avg_mgr, 1),
      avgDealScore: round(dl?.avg_deal, 0),
    });
  }
  rows.sort((a, b) => (b.avgManagerScore ?? -1) - (a.avgManagerScore ?? -1) || b.calls - a.calls);
  return rows;
}

const CRITERION_LABEL: Record<string, string> = {
  opening: "приветствие", discovery: "выявление потребности", questions: "вопросы",
  pain_identification: "выявление проблем", current_situation: "текущая ситуация",
  decision_maker: "выявление ЛПР", budget: "обсуждение бюджета", timeline: "сроки",
  procurement: "закупки", objections: "работа с возражениями",
  product_presentation: "презентация продукта", next_step: "следующий шаг", follow_up: "follow-up",
};

export interface ManagerDetail {
  bitrixUserId: string;
  name: string | null;
  metrics: ManagerRow;
  criteria: Array<{ key: string; label: string; avg: number }>;
  strengths: string[];
  weaknesses: string[];
  recentCalls: Array<{ id: string; startedAt: string | null; callType: string | null; managerScore: number | null; temperature: string | null }>;
}

export async function getManagerDetail(bitrixUserId: string, range?: DateRange): Promise<ManagerDetail | null> {
  const pool = getTimewebPool();
  const list = await listManagers(range);
  const metrics = list.find((m) => m.bitrixUserId === bitrixUserId);
  const nameRow = await pool.query<{ full_name: string | null }>(
    `select full_name from ai_managers where bitrix_user_id = $1`, [bitrixUserId]
  );
  if (!metrics && nameRow.rowCount === 0) return null;

  // Средний балл по критериям (по показательным звонкам менеджера).
  const critParams: unknown[] = [bitrixUserId];
  const crit = await pool.query<{ key: string; avg: string }>(
    `select cr->>'key' key, round(avg((cr->>'score')::numeric),1)::text avg
       from ai_call_analysis a
       join ai_calls c on c.id = a.call_id
       join lateral jsonb_array_elements(a.data->'managerPerformance'->'criteria') cr on true
      where c.bitrix_user_id = $1
        and (a.data->>'connected') <> 'false' and (a.data->>'managerScoreApplicable') <> 'false'
        and cr->>'score' ~ '^-?[0-9.]+$'${callRange(range, critParams)}
      group by 1 order by avg((cr->>'score')::numeric) asc`,
    critParams
  );

  // Сильные/слабые стороны — из разборов сделок менеджера.
  const saParams: unknown[] = [bitrixUserId];
  const sa = await pool.query<{ strengths: string[] | null; weaknesses: string[] | null }>(
    `select di.data->'managerAssessment'->'strengths' as strengths,
            di.data->'managerAssessment'->'weaknesses' as weaknesses
       from ai_deal_insights di join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id
      where d.bitrix_user_id = $1${dealRange(range, saParams)}
      limit 50`,
    saParams
  );
  const flat = (key: "strengths" | "weaknesses") => {
    const counts = new Map<string, number>();
    for (const r of sa.rows) {
      for (const s of (r[key] || [])) {
        const t = String(s).trim().toLowerCase();
        if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
  };

  const recParams: unknown[] = [bitrixUserId];
  const rec = await pool.query<{
    id: string; started_at: Date | null; call_type: string | null; manager_score: string | null; deal_temperature: string | null;
  }>(
    `select c.id, c.started_at, a.data->>'callType' call_type, a.manager_score, a.deal_temperature
       from ai_calls c
       left join lateral (select * from ai_call_analysis aa where aa.call_id=c.id order by aa.created_at desc limit 1) a on true
      where c.bitrix_user_id = $1${callRange(range, recParams)}
      order by c.started_at desc nulls last limit 15`,
    recParams
  );

  return {
    bitrixUserId,
    name: metrics?.name ?? nameRow.rows[0]?.full_name ?? null,
    metrics: metrics ?? {
      bitrixUserId, name: nameRow.rows[0]?.full_name ?? null,
      calls: 0, analyzed: 0, deals: 0, hotDeals: 0, avgManagerScore: null, avgDealScore: null,
    },
    criteria: crit.rows.map((r) => ({ key: r.key, label: CRITERION_LABEL[r.key] || r.key, avg: Number(r.avg) })),
    strengths: flat("strengths"),
    weaknesses: flat("weaknesses"),
    recentCalls: rec.rows.map((r) => ({
      id: r.id,
      startedAt: r.started_at ? r.started_at.toISOString() : null,
      callType: r.call_type,
      managerScore: r.manager_score != null ? Number(r.manager_score) : null,
      temperature: r.deal_temperature,
    })),
  };
}
