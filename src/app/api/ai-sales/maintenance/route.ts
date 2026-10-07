import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getTimewebPool } from "@/lib/timewebPg";
import { ensureBriefsSchema } from "@/lib/server/aiSales/briefsDb";
import { parseResult, plainForBitrix, pushBriefToBitrix } from "@/lib/server/aiSales/briefService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Разовое обслуживание (только админ). POST { action }:
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

  return NextResponse.json({ error: "Неизвестное действие. Доступно: reschedule-briefs, repair-briefs" }, { status: 400 });
}
