import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getFinanceOverview, type FinancePeriod } from "@/lib/server/financeDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Финансовая сводка главной админки. Только РОП/админ. ?period=week|month|half|year */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const p = request.nextUrl.searchParams.get("period");
  const period: FinancePeriod = p === "week" || p === "half" || p === "year" ? p : "month";
  try {
    return NextResponse.json(await getFinanceOverview(period));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка финансовой сводки" }, { status: 500 });
  }
}
