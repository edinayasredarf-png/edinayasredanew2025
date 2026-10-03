import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { autoProcessAllCompanies, autoProcessCompany } from "@/lib/server/contentOsAutoPipeline";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Полностью автоматический конвейер (сбор → отбор ИИ → черновик) для всех
 * компаний. Два способа вызова:
 *  - по расписанию (внешний планировщик, напр. cron-job.org) —
 *    Authorization: Bearer $CRON_SECRET, обрабатывает ВСЕ компании;
 *  - вручную из админки («🤖 Собрать и обработать автоматически» в
 *    Sources) — обычная admin-сессия, обрабатывает только активную
 *    компанию (для проверки/отладки без ожидания крона).
 */
function isCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return (request.headers.get("authorization") || "") === `Bearer ${secret}`;
}

async function handle(request: NextRequest) {
  if (isCron(request)) {
    try {
      const results = await autoProcessAllCompanies();
      return NextResponse.json({ ok: true, results });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка автообработки" }, { status: 500 });
    }
  }

  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  try {
    const result = await autoProcessCompany(getActiveCompanyId(request));
    return NextResponse.json({ ok: true, results: [result] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка автообработки" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

// Внешний планировщик может дёргать и GET.
export async function GET(request: NextRequest) {
  return handle(request);
}
