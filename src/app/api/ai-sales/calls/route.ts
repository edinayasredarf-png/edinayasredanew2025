import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { listCalls } from "@/lib/server/aiSales/readDb";
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
    const data = await listCalls({
      managerBitrixId: managerFilterFor(user),
      temperature: sp.get("temperature"),
      status: sp.get("status"),
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
      offset: sp.get("offset") ? Number(sp.get("offset")) : undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка списка звонков";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
