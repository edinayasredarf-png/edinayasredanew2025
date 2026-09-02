import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { listManagers } from "@/lib/server/aiSales/managersDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Список менеджеров с перформансом. Только РОП/админ (§58 — приватность оценок). */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  try {
    const items = await listManagers({ from: sp.get("from"), to: sp.get("to") });
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка менеджеров";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
