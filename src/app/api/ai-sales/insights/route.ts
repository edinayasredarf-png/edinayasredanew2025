import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getInsights } from "@/lib/server/aiSales/insightsDb";
import { managerFilterFor } from "@/lib/server/aiSales/rbacFilter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const data = await getInsights(managerFilterFor(user), { from: sp.get("from"), to: sp.get("to") });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка инсайтов";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
