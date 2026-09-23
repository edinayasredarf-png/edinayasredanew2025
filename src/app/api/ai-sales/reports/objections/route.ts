import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getObjectionsByManager } from "@/lib/server/aiSales/reportsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Возражения по менеджерам: всего / не отработано / % отработки. РОП/админ. */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  try {
    const items = await getObjectionsByManager({ from: sp.get("from"), to: sp.get("to") });
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка отчёта";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
