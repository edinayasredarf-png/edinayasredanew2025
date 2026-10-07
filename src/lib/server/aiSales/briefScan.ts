import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";
import { ensureBriefsSchema } from "@/lib/server/aiSales/briefsDb";
import { getDealStageDictionary, refreshDealStageDictionary } from "@/lib/server/bitrix/dealStages";

/** Номер недели ISO вида 2026-W41 — ключ идемпотентности еженедельной перепроверки. */
function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Ставит hourly-сканер брифов (идемпотентно: один раз в час). */
export async function scheduleBriefScan(): Promise<void> {
  const hour = new Date().toISOString().slice(0, 13);
  await enqueueJob({ type: "brief.scan", idempotencyKey: `brief.scan:${hour}`, priority: 200, maxAttempts: 2 });
  // Заодно раз в час актуализируем зеркало сделок/лидов (финансовая сводка, брифы): только изменённые за последние 3 часа.
  const since = new Date(Date.now() - 3 * 3600_000).toISOString();
  for (const entity of ["deals", "leads"] as const) {
    await enqueueJob({ type: "bitrix.sync", payload: { entity, start: 0, since }, priority: 35, maxAttempts: 2, idempotencyKey: `bitrix.sync:${entity}:inc:${hour}` });
  }
}

/** Новые лиды (за последние 3 дня) без брифа → задача brief.lead. */
async function scanNewLeads(): Promise<number> {
  const { rows } = await getTimewebPool().query<{ bitrix_lead_id: string }>(
    `select l.bitrix_lead_id from ai_leads l
      where l.bitrix_created_at > now() - interval '3 days'
        and coalesce(l.is_converted, false) = false
        and not exists (select 1 from ai_briefs b where b.entity_type = 'lead' and b.bitrix_entity_id = l.bitrix_lead_id)
      order by l.bitrix_created_at desc limit 30`);
  for (const r of rows) {
    await enqueueJob({ type: "brief.lead", payload: { leadId: r.bitrix_lead_id }, priority: 150, maxAttempts: 2, idempotencyKey: `brief:lead:${r.bitrix_lead_id}` });
  }
  return rows.length;
}

/** STAGE_ID этапа «Отложенный спрос» воронки «Отдел продаж» (по названию из справочника стадий). */
async function deferredStageIds(): Promise<string[]> {
  const dict = (await getDealStageDictionary()) ?? (await refreshDealStageDictionary());
  return Object.entries(dict.dealStages)
    .filter(([, e]) => /отложен/i.test(e.name) && e.pipeline === "sales")
    .map(([id]) => id);
}

/** Открытые сделки на этапе «Отложенный спрос» → раз в неделю задача brief.deal. */
async function scanDeferredDeals(): Promise<number> {
  const stages = await deferredStageIds();
  if (!stages.length) return 0;
  const { rows } = await getTimewebPool().query<{ bitrix_deal_id: string }>(
    `select bitrix_deal_id from ai_deals where stage_id = any($1::text[]) and not is_closed order by bitrix_updated_at desc nulls last limit 300`,
    [stages]);
  const week = isoWeek();
  // Растягиваем недельную проверку по дням: поиск платный (0,49 ₽/запрос, у агента дневной лимит) —
  // по умолчанию 25 сделок в сутки; остальные получают run_after на следующие дни.
  const perDay = Math.max(1, Number(process.env.BRIEF_DEALS_PER_DAY) || 25);
  const now = Date.now();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    await enqueueJob({
      type: "brief.deal", payload: { dealId: r.bitrix_deal_id }, priority: 160, maxAttempts: 2,
      idempotencyKey: `brief:deal:${r.bitrix_deal_id}:${week}`,
      runAfter: new Date(now + Math.floor(i / perDay) * 24 * 3600 * 1000),
    });
  }
  return rows.length;
}

export async function runBriefScan(): Promise<{ leads: number; deals: number }> {
  await ensureBriefsSchema();
  const leads = await scanNewLeads();
  const deals = await scanDeferredDeals();
  return { leads, deals };
}
