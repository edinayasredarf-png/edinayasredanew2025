import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbListLetterSends } from "@/lib/server/letterSendsDb";
import { mskToday, mskDaysAgo, parseRange } from "@/lib/server/dateRange";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type SendsPeriod = "today" | "week" | "month" | "range" | "all";

/**
 * Период → диапазон дат МСК (включительно).
 *  today — сегодня
 *  week  — последние 7 дней (включая сегодня)
 *  month — последние 30 дней (включая сегодня)
 *  range — произвольный, из from/to
 *  all   — без ограничения по датам
 */
function resolvePeriod(
  period: string | null,
  fromRaw: string | null,
  toRaw: string | null
): { from?: string; to?: string } {
  switch (period) {
    case "today":
      return { from: mskToday(), to: mskToday() };
    case "week":
      return { from: mskDaysAgo(6), to: mskToday() };
    case "month":
      return { from: mskDaysAgo(29), to: mskToday() };
    case "all":
      return {};
    case "range":
      // parseRange сам валидирует, переворачивает from>to и ограничивает 366 днями
      return parseRange(fromRaw, toRaw);
    default:
      return { from: mskDaysAgo(29), to: mskToday() };
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const sp = request.nextUrl.searchParams;
    const limitRaw = Number(sp.get("limit") || 500);
    const { from, to } = resolvePeriod(sp.get("period"), sp.get("from"), sp.get("to"));
    const sends = await dbListLetterSends({
      from,
      to,
      limit: Number.isFinite(limitRaw) ? limitRaw : 500,
    });
    return NextResponse.json({ sends, from: from || null, to: to || null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка БД";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
