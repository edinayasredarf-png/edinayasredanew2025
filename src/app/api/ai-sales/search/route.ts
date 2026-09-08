import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { searchTranscripts } from "@/lib/server/aiSales/searchDb";
import { managerFilterFor } from "@/lib/server/aiSales/rbacFilter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Полнотекстовый поиск по репликам звонков. */
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
    const data = await searchTranscripts({
      query: sp.get("q") || "",
      managerBitrixId: managerFilterFor(user),
      managerFilter: sp.get("manager"),
      department: sp.get("department"),
      from: sp.get("from"),
      to: sp.get("to"),
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка поиска";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
