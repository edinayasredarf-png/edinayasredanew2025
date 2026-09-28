import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getTriggers } from "@/lib/server/aiSales/reportsDb";
import { managerFilterFor } from "@/lib/server/aiSales/rbacFilter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Звонки с найденным триггером (§ речевая аналитика — внешние поводы к сделке). */
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  try {
    const rows = await getTriggers(managerFilterFor(user), sp.get("type"), {
      from: sp.get("from"),
      to: sp.get("to"),
    });
    return NextResponse.json({ items: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка триггеров";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
