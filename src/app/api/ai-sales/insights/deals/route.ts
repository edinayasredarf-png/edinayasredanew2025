import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getInsightDeals, type InsightKind } from "@/lib/server/aiSales/insightsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: InsightKind[] = ["objection", "product", "pain", "competitor"];

/** Drill-down: конкретные сделки за агрегатом «Отчётов» (по какой сделке проблема). */
export async function GET(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  const kind = sp.get("kind") as InsightKind | null;
  const value = sp.get("value") || "";
  if (!kind || !KINDS.includes(kind) || !value.trim()) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  try {
    const items = await getInsightDeals(kind, value, null, { from: sp.get("from"), to: sp.get("to") });
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
