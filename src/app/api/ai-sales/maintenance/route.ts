import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getTimewebPool } from "@/lib/timewebPg";
import { reconcileCalls } from "@/lib/server/aiSales/callReconcile";
import { bbLink, crmLink, sendBotMessage, whoAmI } from "@/lib/server/bitrix/messenger";
import { ensureBriefsSchema } from "@/lib/server/aiSales/briefsDb";
import { parseResult, plainForBitrix, pushBriefToBitrix } from "@/lib/server/aiSales/briefService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Разовое обслуживание (только админ). POST { action }:
 *  - "backfill-calls" { days = 14, dryRun = true }: сверка звонков Bitrix с ai_calls — события, не дошедшие через
 *    nginx, подтягиваются заново (call.ingest). По умолчанию только подсчёт; dryRun=false ставит задачи.
 *  - "reschedule-briefs": ожидающие задачи brief.deal растягиваются по дням (по BRIEF_DEALS_PER_DAY в сутки,
 *    первая порция — через 12 часов), чтобы не упереться в дневной лимит платного поиска.
 *  - "repair-briefs": брифы, сохранённые с оборванным блоком ```json, разбираются заново (без нового поиска):
 *    чистится текст, восстанавливаются триггеры, текст перезаписывается в поле Bitrix (если был записан).
 *    Порциями по 25 за вызов — повторять, пока remaining > 0.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только администратору" }, { status });
  }
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const pool = getTimewebPool();

  if (body.action === "reschedule-briefs") {
    const perDay = Math.max(1, Number(process.env.BRIEF_DEALS_PER_DAY) || 25);
    const { rows } = await pool.query<{ n: string; last_due: Date | null }>(
      `with q as (
         select id, row_number() over (order by created_at) - 1 as rn
           from ai_jobs where type = 'brief.deal' and status in ('PENDING','RETRY_PENDING')
       ), u as (
         update ai_jobs j
            set run_after = now() + interval '12 hours' + (floor(q.rn / $1::numeric)::int || ' days')::interval, updated_at = now()
           from q where j.id = q.id
         returning j.run_after
       )
       select count(*)::text as n, max(run_after) as last_due from u`,
      [perDay]
    );
    return NextResponse.json({ ok: true, rescheduled: Number(rows[0]?.n ?? 0), perDay, lastDue: rows[0]?.last_due ?? null });
  }

  if (body.action === "repair-briefs") {
    await ensureBriefsSchema();
    const pending = await pool.query<{ id: string; entity_type: "lead" | "deal"; bitrix_entity_id: string; brief_text: string | null; pushed_at: Date | null }>(
      `select id, entity_type, bitrix_entity_id, brief_text, pushed_at from ai_briefs
        where status = 'READY' and brief_text like '%\`\`\`%' order by created_at limit 25`
    );
    let fixed = 0, repushed = 0, pushFailed = 0;
    for (const b of pending.rows) {
      const parsed = parseResult(b.brief_text ?? "");
      await pool.query(`update ai_briefs set brief_text = $2, triggers = $3::jsonb where id = $1`, [b.id, parsed.text, JSON.stringify(parsed.triggers)]);
      fixed++;
      if (b.pushed_at) {
        try {
          await pushBriefToBitrix(b.entity_type, b.bitrix_entity_id, plainForBitrix(parsed.text, parsed.triggers));
          repushed++;
        } catch { pushFailed++; }
      }
    }
    const left = await pool.query<{ n: string }>(`select count(*)::text n from ai_briefs where status = 'READY' and brief_text like '%\`\`\`%'`);
    return NextResponse.json({ ok: true, fixed, repushed, pushFailed, remaining: Number(left.rows[0]?.n ?? 0) });
  }

  if (body.action === "backfill-calls") {
    const days = Number((body as { days?: number }).days) || 14;
    const dryRun = (body as { dryRun?: boolean }).dryRun !== false;
    return NextResponse.json({ ok: true, ...(await reconcileCalls({ days, dryRun })) });
  }

  if (body.action === "bitrix-whoami") {
    return NextResponse.json({ ok: true, ...(await whoAmI()) });
  }

  if (body.action === "bot-test") {
    // Тестовое личное сообщение от бота: { userId } — кому (по умолчанию никому: сначала whoami).
    const userId = String((body as { userId?: string }).userId ?? "").trim();
    if (!/^\d+$/.test(userId)) return NextResponse.json({ error: "Укажите userId (число)" }, { status: 400 });
    const r = await sendBotMessage(userId, `[B]Проверка связи[/B]\nЭто тестовое сообщение от Эко_бота: рассылка разборов звонков и брифов настроена. ${bbLink(crmLink("deal", "14033"), "Пример ссылки на сделку")}`);
    return NextResponse.json(r);
  }

  if (body.action === "finance-debug") {
    const q = async (sql: string) => { try { return (await pool.query(sql)).rows; } catch (e) { return { error: e instanceof Error ? e.message : String(e) }; } };
    return NextResponse.json({
      ok: true,
      totals: await q(`select count(*)::int total, count(*) filter (where is_won)::int won, count(*) filter (where is_closed)::int closed, count(*) filter (where close_date is not null)::int with_close_date, max(bitrix_updated_at) last_updated, max(close_date) last_close from ai_deals`),
      wonByMonth: await q(`select to_char(coalesce(close_date, bitrix_updated_at::date), 'YYYY-MM') m, count(*)::int n, round(sum(coalesce(opportunity,0)))::bigint s from ai_deals where is_won group by 1 order by 1 desc limit 8`),
      closedStages: await q(`select stage_id, is_won, count(*)::int n from ai_deals where is_closed group by 1,2 order by n desc limit 12`),
      syncState: await q(`select * from ai_bitrix_sync_state order by 1 limit 10`),
    });
  }

  return NextResponse.json({ error: "Неизвестное действие. Доступно: reschedule-briefs, repair-briefs, backfill-calls, bitrix-whoami, bot-test" }, { status: 400 });
}
