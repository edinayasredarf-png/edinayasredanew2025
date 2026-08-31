import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getDashboard } from "@/lib/server/aiSales/readDb";
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
  try {
    const data = await getDashboard(managerFilterFor(user));
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка дашборда";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
