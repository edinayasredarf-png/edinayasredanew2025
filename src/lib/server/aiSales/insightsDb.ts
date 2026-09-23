import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

/**
 * AI Insights — агрегаты по разборам звонков (§9,§81 ТЗ). Всё обычным SQL (§45),
 * без LLM: топ продуктов/болей/возражений/конкурентов, доля звонков без обсуждения
 * бюджета, упоминания закупок, слабые критерии менеджеров, распределение результатов.
 * Берём ПОСЛЕДНИЙ анализ по каждому звонку (re-run не задваивает).
 */

export interface Insights {
  totalAnalyzed: number;
  topProducts: Array<{ name: string; count: number }>;
  topPainPoints: Array<{ name: string; count: number }>;
  topObjections: Array<{ text: string; count: number; unhandled: number }>;
  topCompetitors: Array<{ name: string; count: number }>;
  budgetNotDiscussedRate: number | null;
  procurementMentions: number;
  resultDistribution: Array<{ type: string; count: number }>;
  managerWeakCriteria: Array<{ key: string; avg: number }>;
  headlines: string[];
}

interface DateRange { from?: string | null; to?: string | null }

/** WHERE для latest-CTE (по c.started_at + менеджер). */
function buildFilter(managerBitrixId: string | null, range?: DateRange): { sql: string; params: unknown[] } {
  const parts: string[] = ["a.call_id is not null"];
  const params: unknown[] = [];
  if (managerBitrixId) { params.push(managerBitrixId); parts.push(`c.bitrix_user_id = $${params.length}`); }
  if (range?.from) { params.push(range.from); parts.push(`c.started_at >= $${params.length}::date`); }
  if (range?.to) { params.push(range.to); parts.push(`c.started_at < ($${params.length}::date + interval '1 day')`); }
  return { sql: parts.join(" and "), params };
}

const CRITERION_LABEL: Record<string, string> = {
  opening: "приветствие", discovery: "выявление потребности", questions: "вопросы",
  pain_identification: "выявление проблем", current_situation: "текущая ситуация",
  decision_maker: "выявление ЛПР", budget: "обсуждение бюджета", timeline: "сроки",
  procurement: "закупки", objections: "работа с возражениями",
  product_presentation: "презентация продукта", next_step: "следующий шаг", follow_up: "follow-up",
};

export async function getInsights(
  managerBitrixId: string | null,
  range?: DateRange
): Promise<Insights> {
  const pool = getTimewebPool();
  const f = buildFilter(managerBitrixId, range);
  // Префикс с latest-CTE, переиспользуем в каждом запросе.
  const cte = `with latest as (
     select distinct on (a.call_id) a.call_id, a.data
       from ai_call_analysis a join ai_calls c on c.id = a.call_id
      where ${f.sql}
      order by a.call_id, a.created_at desc
   )`;

  const q = <T extends Record<string, unknown>>(sql: string) => pool.query<T>(`${cte} ${sql}`, f.params);

  const [totalR, products, pains, objections, competitors, budget, procurement, results, criteria] = await Promise.all([
    q<{ n: string }>(`select count(*)::text n from latest`),
    q<{ name: string; n: string }>(
      `select lower(trim(p->>'name')) name, count(*)::text n
         from latest, jsonb_array_elements(data->'products') p
        where coalesce(trim(p->>'name'),'') <> ''
        group by 1 order by count(*) desc limit 10`
    ),
    q<{ name: string; n: string }>(
      `select lower(trim(x)) name, count(*)::text n
         from latest, jsonb_array_elements_text(data->'painPoints') x
        where coalesce(trim(x),'') <> ''
        group by 1 order by count(*) desc limit 10`
    ),
    q<{ text: string; n: string; unh: string }>(
      `select lower(trim(o->>'text')) text, count(*)::text n,
              count(*) filter (where (o->>'handled') = 'false')::text unh
         from latest, jsonb_array_elements(data->'objections') o
        where coalesce(trim(o->>'text'),'') <> ''
        group by 1 order by count(*) desc limit 10`
    ),
    q<{ name: string; n: string }>(
      `select lower(trim(cmp->>'name')) name, count(*)::text n
         from latest, jsonb_array_elements(data->'competitors') cmp
        where coalesce(trim(cmp->>'name'),'') <> ''
        group by 1 order by count(*) desc limit 10`
    ),
    q<{ not_disc: string; total: string }>(
      `select count(*) filter (where (data->'budget'->>'discussed') = 'false')::text not_disc,
              count(*)::text total
         from latest
        where (data->>'connected') <> 'false' and (data->>'managerScoreApplicable') <> 'false'`
    ),
    q<{ n: string }>(`select count(*)::text n from latest where (data->'procurement'->>'mentioned') = 'true'`),
    q<{ type: string; n: string }>(
      `select coalesce(data->'result'->>'type','other') type, count(*)::text n
         from latest group by 1 order by count(*) desc`
    ),
    q<{ key: string; avg: string }>(
      `select cr->>'key' key, round(avg((cr->>'score')::numeric),1)::text avg
         from latest, jsonb_array_elements(data->'managerPerformance'->'criteria') cr
        where (data->>'connected') <> 'false' and (data->>'managerScoreApplicable') <> 'false'
          and cr->>'score' ~ '^-?[0-9.]+$'
        group by 1 order by avg((cr->>'score')::numeric) asc limit 5`
    ),
  ]);

  const totalAnalyzed = Number(totalR.rows[0]?.n ?? 0);
  const topProducts = products.rows.map((r) => ({ name: r.name, count: Number(r.n) }));
  const topPainPoints = pains.rows.map((r) => ({ name: r.name, count: Number(r.n) }));
  const topObjections = objections.rows.map((r) => ({ text: r.text, count: Number(r.n), unhandled: Number(r.unh) }));
  const topCompetitors = competitors.rows.map((r) => ({ name: r.name, count: Number(r.n) }));
  const notDisc = Number(budget.rows[0]?.not_disc ?? 0);
  const budgTotal = Number(budget.rows[0]?.total ?? 0);
  const budgetNotDiscussedRate = budgTotal ? Math.round((notDisc / budgTotal) * 100) : null;
  const procurementMentions = Number(procurement.rows[0]?.n ?? 0);
  const resultDistribution = results.rows.map((r) => ({ type: r.type, count: Number(r.n) }));
  const managerWeakCriteria = criteria.rows.map((r) => ({ key: r.key, avg: Number(r.avg) }));

  // Автоформулировки инсайтов (§9) из посчитанных метрик.
  const headlines: string[] = [];
  if (budgetNotDiscussedRate != null && budgetNotDiscussedRate >= 30) {
    headlines.push(`В ${budgetNotDiscussedRate}% состоявшихся звонков менеджеры не обсуждают бюджет.`);
  }
  if (topObjections[0]) {
    headlines.push(`Самое частое возражение: «${topObjections[0].text}» (${topObjections[0].count}).`);
  }
  if (topCompetitors[0]) {
    headlines.push(`Чаще всего упоминается конкурент: ${topCompetitors[0].name} (${topCompetitors[0].count}).`);
  }
  if (topProducts[0]) {
    headlines.push(`Самый востребованный продукт: ${topProducts[0].name} (${topProducts[0].count}).`);
  }
  if (topPainPoints[0]) {
    headlines.push(`Главная боль клиентов: ${topPainPoints[0].name} (${topPainPoints[0].count}).`);
  }
  if (managerWeakCriteria[0]) {
    const w = managerWeakCriteria[0];
    headlines.push(`Слабое место менеджеров: ${CRITERION_LABEL[w.key] || w.key} (средний ${w.avg}/10).`);
  }

  return {
    totalAnalyzed, topProducts, topPainPoints, topObjections, topCompetitors,
    budgetNotDiscussedRate, procurementMentions, resultDistribution, managerWeakCriteria, headlines,
  };
}

export { CRITERION_LABEL };

/* ─── Drill-down: конкретные сделки за агрегатом (по какой сделке проблема) ─── */

export type InsightKind = "objection" | "product" | "pain" | "competitor";

export interface InsightDeal {
  callId: string;
  bitrixDealId: string | null;
  company: string | null;
  manager: string | null;
  dealUrl: string | null;
  startedAt: string | null;
  context: string | null;   // для возражения — дословная цитата
  unhandled?: boolean;      // для возражения — не отработано
}

/** Пути JSONB для каждого типа агрегата (совпадают с getInsights). */
const KIND_MATCH: Record<InsightKind, string> = {
  objection: `exists (select 1 from jsonb_array_elements(l.data->'objections') o where lower(trim(o->>'text')) = $VAL$)`,
  product: `exists (select 1 from jsonb_array_elements(l.data->'products') p where lower(trim(p->>'name')) = $VAL$)`,
  pain: `exists (select 1 from jsonb_array_elements_text(l.data->'painPoints') x where lower(trim(x)) = $VAL$)`,
  competitor: `exists (select 1 from jsonb_array_elements(l.data->'competitors') cmp where lower(trim(cmp->>'name')) = $VAL$)`,
};

/** Сделки/звонки, где встретился конкретный агрегат (возражение/продукт/боль/конкурент). */
export async function getInsightDeals(
  kind: InsightKind,
  value: string,
  managerBitrixId: string | null,
  range?: DateRange
): Promise<InsightDeal[]> {
  const v = (value || "").trim().toLowerCase();
  if (!v || !KIND_MATCH[kind]) return [];
  const pool = getTimewebPool();
  const f = buildFilter(managerBitrixId, range);
  const params = [...f.params, v];
  const vRef = `$${params.length}`;
  const match = KIND_MATCH[kind].replace("$VAL$", vRef);

  // Для возражения — дословная цитата и статус «не отработано».
  const objLateral =
    kind === "objection"
      ? `left join lateral (
           select o->>'quote' quote, (o->>'handled') handled
             from jsonb_array_elements(l.data->'objections') o
            where lower(trim(o->>'text')) = ${vRef}
            order by (case when (o->>'handled') = 'false' then 0 else 1 end)
            limit 1
         ) ol on true`
      : "";
  const objSelect = kind === "objection" ? `ol.quote as context, (ol.handled = 'false') as unhandled` : `null::text as context, null::boolean as unhandled`;

  const { rows } = await pool.query<{
    call_id: string; bitrix_deal_id: string | null; company: string | null;
    manager: string | null; started_at: Date | null; context: string | null; unhandled: boolean | null;
  }>(
    `with latest as (
       select distinct on (a.call_id) a.call_id, a.data,
              c.bitrix_deal_id, c.bitrix_company_id, c.bitrix_user_id, c.started_at
         from ai_call_analysis a join ai_calls c on c.id = a.call_id
        where ${f.sql}
        order by a.call_id, a.created_at desc
     )
     select l.call_id, l.bitrix_deal_id, l.started_at,
            comp.title as company, m.full_name as manager, ${objSelect}
       from latest l
       left join ai_companies comp on comp.bitrix_company_id = l.bitrix_company_id
       left join ai_managers m on m.bitrix_user_id = l.bitrix_user_id
       ${objLateral}
      where ${match}
      order by l.started_at desc nulls last
      limit 60`,
    params
  );

  const origin = bitrixPortalOrigin();
  return rows.map((r) => ({
    callId: r.call_id,
    bitrixDealId: r.bitrix_deal_id,
    company: r.company,
    manager: r.manager,
    dealUrl: r.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
    startedAt: r.started_at ? r.started_at.toISOString() : null,
    context: r.context,
    unhandled: r.unhandled ?? undefined,
  }));
}
