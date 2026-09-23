import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getObjectionCalls } from "@/lib/server/aiSales/reportsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Звонки менеджера с возражениями (по умолчанию — не отработанными). */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  const uid = sp.get("uid") || "";
  if (!uid) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  const onlyUnhandled = sp.get("unhandled") !== "0";
  try {
    const items = await getObjectionCalls(uid, onlyUnhandled, { from: sp.get("from"), to: sp.get("to") });
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
