import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getStepCalls } from "@/lib/server/aiSales/reportsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Провал по ячейке: звонки, где менеджер выполнил/провалил конкретный шаг. */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  const uid = sp.get("uid") || "";
  const key = sp.get("key") || "";
  const completed = sp.get("completed") === "1";
  if (!uid || !key) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  try {
    const items = await getStepCalls(uid, key, completed, { from: sp.get("from"), to: sp.get("to") });
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
