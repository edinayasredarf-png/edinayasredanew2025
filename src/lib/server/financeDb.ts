import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { getDealStageDictionary, refreshDealStageDictionary } from "@/lib/server/bitrix/dealStages";
import { getSettingValue } from "@/lib/server/aiSales/settingsDb";
import { ensureDealFinanceColumns } from "@/lib/server/aiSales/syncDb";

/**
 * Финансовая сводка главной админки («Финансы компании»).
 * Источник — зеркало сделок Bitrix (ai_deals): доход = сумма успешных сделок по дате закрытия (CLOSEDATE; пока дата не
 * подтянута синхронизацией — по дате изменения), «контракты в работе» = все открытые сделки. Планы и затраты задаются
 * вручную (ai_settings, ключи finance.*) и пересчитываются на период пропорционально дням.
 */

export type FinancePeriod = "week" | "month" | "half" | "year";
const AVG_MONTH_DAYS = 30.4375;
const MS_DAY = 86_400_000;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * MS_DAY);
/** Сегодняшняя дата в Москве как UTC-полночь. */
function mskToday(): Date {
  const n = new Date(Date.now() + 3 * 3600_000);
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}
const WEEKDAY = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

interface Bucket { label: string; from: string; to: string; days: number; planFactor: number }

/** Корзины графика и множитель плана «в месячных долях» для каждой. */
function buildBuckets(period: FinancePeriod): { from: string; to: string; buckets: Bucket[]; periodFactor: number; label: string } {
  const today = mskToday();
  if (period === "week") {
    const buckets: Bucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      buckets.push({ label: WEEKDAY[d.getUTCDay()], from: iso(d), to: iso(d), days: 1, planFactor: 1 / AVG_MONTH_DAYS });
    }
    return { from: buckets[0].from, to: iso(today), buckets, periodFactor: 7 / AVG_MONTH_DAYS, label: "Последние 7 дней" };
  }
  if (period === "month") {
    const y = today.getUTCFullYear(), m = today.getUTCMonth();
    const first = new Date(Date.UTC(y, m, 1));
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const buckets: Bucket[] = [];
    for (let start = 1, n = 1; start <= dim; start += 7, n++) {
      const end = Math.min(start + 6, dim);
      buckets.push({ label: `${n} Нед.`, from: iso(new Date(Date.UTC(y, m, start))), to: iso(new Date(Date.UTC(y, m, end))), days: end - start + 1, planFactor: (end - start + 1) / dim });
    }
    return { from: iso(first), to: iso(new Date(Date.UTC(y, m, dim))), buckets, periodFactor: 1, label: `${["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"][m]} ${y}` };
  }
  const n = period === "half" ? 6 : 12;
  const buckets: Bucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
    const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
    buckets.push({ label: MONTH[first.getUTCMonth()], from: iso(first), to: iso(last), days: last.getUTCDate(), planFactor: 1 });
  }
  return { from: buckets[0].from, to: buckets[buckets.length - 1].to, buckets, periodFactor: n, label: period === "half" ? "Последние 6 месяцев" : "Последние 12 месяцев" };
}

export interface FinancePlans {
  incomePlanMonthly: number | null;
  expensesMonthly: number | null;
  salesPlanMonthly: number | null;
  linePlanDefaultMin: number | null;
  linePlanByManager: Record<string, number>;
}

export async function getFinancePlans(): Promise<FinancePlans> {
  const num = async (k: string) => {
    const v = await getSettingValue<unknown>(k, null);
    const n = Number(v);
    return v == null || v === "" || !Number.isFinite(n) || n <= 0 ? null : n;
  };
  const byMgr = await getSettingValue<Record<string, unknown>>("finance.linePlanByManager", {});
  const linePlanByManager: Record<string, number> = {};
  for (const [k, v] of Object.entries(byMgr ?? {})) { const n = Number(v); if (Number.isFinite(n) && n > 0) linePlanByManager[k] = n; }
  const [incomePlanMonthly, expensesMonthly, salesPlanMonthly, linePlanDefaultMin] = await Promise.all([
    num("finance.incomePlanMonthly"), num("finance.expensesMonthly"), num("finance.salesPlanMonthly"), num("finance.linePlanDefaultMin"),
  ]);
  return { incomePlanMonthly, expensesMonthly, salesPlanMonthly, linePlanDefaultMin, linePlanByManager };
}

const money = (n: number) => Math.round(n);

export async function getFinanceOverview(period: FinancePeriod) {
  await ensureDealFinanceColumns();
  const pool = getTimewebPool();
  const dict = (await getDealStageDictionary()) ?? (await refreshDealStageDictionary());
  const stages = dict.dealStages;
  const stageIds = (pred: (e: (typeof stages)[string]) => boolean) => Object.entries(stages).filter(([, e]) => pred(e)).map(([id]) => id);

  const plans = await getFinancePlans();
  const { from, to, buckets, periodFactor, label } = buildBuckets(period);

  // Успешные сделки за период: дата закрытия (если ещё не подтянута — дата изменения).
  const won = await pool.query<{ d: string; stage_id: string | null; amt: number; known: boolean }>(
    `select coalesce(close_date, bitrix_updated_at::date)::text as d, stage_id, coalesce(opportunity, 0)::float8 as amt, (close_date is not null) as known
       from ai_deals where is_won = true and coalesce(close_date, bitrix_updated_at::date) between $1::date and $2::date`,
    [from, to]
  );
  const incomeSeries = buckets.map((b) => ({ label: b.label, from: b.from, to: b.to, fact: 0, plan: plans.incomePlanMonthly ? money(plans.incomePlanMonthly * b.planFactor) : null as number | null }));
  let incomeFact = 0, incomeCount = 0, salesFact = 0, salesCount = 0, knownCount = 0;
  for (const r of won.rows) {
    incomeFact += r.amt; incomeCount++;
    if (r.known) knownCount++;
    const bi = buckets.findIndex((b) => r.d >= b.from && r.d <= b.to);
    if (bi >= 0) incomeSeries[bi].fact += r.amt;
    if (r.stage_id && stages[r.stage_id]?.pipeline === "sales") { salesFact += r.amt; salesCount++; }
  }
  incomeSeries.forEach((s) => { s.fact = money(s.fact); });

  const incomePlan = plans.incomePlanMonthly ? money(plans.incomePlanMonthly * periodFactor) : null;
  const expenses = plans.expensesMonthly ? money(plans.expensesMonthly * periodFactor) : null;
  const salesPlan = plans.salesPlanMonthly ? money(plans.salesPlanMonthly * periodFactor) : null;

  // Открытые сделки («контракты в работе»).
  const open = await pool.query<{ n: number; s: number }>(`select count(*)::int n, coalesce(sum(opportunity), 0)::float8 s from ai_deals where not is_closed`);

  // Отдел управления проектами: ожидают оплаты и крупнейшие контракты в работе.
  const waitingIds = stageIds((e) => e.pipeline === "project" && (e.canonicalKey === "project_delivered_unpaid" || e.canonicalKey === "project_overdue_debt" || /не ?оплач|задолж/i.test(e.name)));
  const inWorkIds = stageIds((e) => e.pipeline === "project" && (e.canonicalKey === "project_in_progress" || /^в работе$/i.test(e.name.trim())));
  const waiting = waitingIds.length
    ? (await pool.query<{ n: number; s: number }>(`select count(*)::int n, coalesce(sum(opportunity), 0)::float8 s from ai_deals where not is_closed and stage_id = any($1::text[])`, [waitingIds])).rows[0]
    : { n: 0, s: 0 };
  const top = inWorkIds.length
    ? (await pool.query<{ id: string; title: string | null; company: string | null; amt: number }>(
        `select d.bitrix_deal_id as id, d.title, co.title as company, coalesce(d.opportunity, 0)::float8 as amt
           from ai_deals d left join ai_companies co on co.bitrix_company_id = d.bitrix_company_id
          where not d.is_closed and d.stage_id = any($1::text[]) order by d.opportunity desc nulls last limit 6`, [inWorkIds])).rows
    : [];

  // Отдел сервиса: пролонгации за 30 дней.
  const prolongIds = stageIds((e) => e.pipeline === "service" && (e.canonicalKey === "service_prolonged" || /пролонгирован/i.test(e.name)));
  const prolong = prolongIds.length
    ? (await pool.query<{ n: number; s: number }>(`select count(*)::int n, coalesce(sum(opportunity), 0)::float8 s from ai_deals where stage_id = any($1::text[]) and bitrix_updated_at >= now() - interval '30 days'`, [prolongIds])).rows[0]
    : { n: 0, s: 0 };

  // Время на линии сегодня: менеджеры отдела продаж.
  let mgrs = (await pool.query<{ id: string; name: string | null; avatar: string | null }>(
    `select m.bitrix_user_id as id, m.full_name as name, null::text as avatar from ai_managers m
       join ai_departments dp on dp.id = m.department_id where m.active and dp.name ilike '%продаж%' order by m.full_name`)).rows;
  const todayCalls = await pool.query<{ uid: string; calls: number; sec: number }>(
    `select c.bitrix_user_id as uid, count(*)::int calls, coalesce(sum(c.duration_sec), 0)::int sec from ai_calls c
      where (c.started_at at time zone 'Europe/Moscow')::date = (now() at time zone 'Europe/Moscow')::date group by 1`);
  const callMap = new Map(todayCalls.rows.map((r) => [r.uid, r]));
  if (!mgrs.length) {
    // Отдел не заведён — показываем тех, кто сегодня звонил.
    const ids = todayCalls.rows.map((r) => r.uid).filter(Boolean);
    if (ids.length) mgrs = (await pool.query<{ id: string; name: string | null; avatar: string | null }>(`select bitrix_user_id as id, full_name as name, null::text as avatar from ai_managers where bitrix_user_id = any($1::text[]) order by full_name`, [ids])).rows;
  }
  const lineManagers = mgrs.map((m) => {
    const c = callMap.get(m.id);
    const planMin = plans.linePlanByManager[m.id] ?? plans.linePlanDefaultMin ?? null;
    return { id: m.id, name: m.name ?? `ID ${m.id}`, minutes: Math.round((c?.sec ?? 0) / 60), calls: c?.calls ?? 0, planMin, individualPlan: plans.linePlanByManager[m.id] ?? null };
  });
  const callsToday = todayCalls.rows.reduce((a, r) => a + r.calls, 0);

  return {
    period, from, to, label,
    income: { fact: money(incomeFact), count: incomeCount, plan: incomePlan, pct: incomePlan ? Math.round((incomeFact / incomePlan) * 100) : null, reserve: incomePlan ? money(incomePlan - incomeFact) : null },
    expenses: { amount: expenses, monthly: plans.expensesMonthly },
    forecastRemainder: money(incomeFact - (expenses ?? 0)),
    contractsInWork: { sum: money(open.rows[0]?.s ?? 0), count: open.rows[0]?.n ?? 0 },
    series: incomeSeries,
    sales: { fact: money(salesFact), count: salesCount, plan: salesPlan, pct: salesPlan ? Math.round((salesFact / salesPlan) * 100) : null },
    projects: { waiting: { sum: money(waiting.s), count: waiting.n }, topContracts: top.map((t) => ({ id: t.id, name: t.company || t.title || `Сделка #${t.id}`, amount: money(t.amt) })) },
    service: { prolongations: { sum: money(prolong.s), count: prolong.n, days: 30 } },
    line: { date: iso(mskToday()), callsToday, defaultPlanMin: plans.linePlanDefaultMin, managers: lineManagers },
    plans,
    closeDateKnownPct: won.rows.length ? Math.round((knownCount / won.rows.length) * 100) : 100,
    generatedAt: new Date().toISOString(),
  };
}
