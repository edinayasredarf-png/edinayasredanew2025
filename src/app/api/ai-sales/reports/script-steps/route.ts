import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getScriptStepMatrix } from "@/lib/server/aiSales/reportsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Матрица «менеджер × шаги скрипта»: % выполнения + средний балл. РОП/админ. */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  try {
    const data = await getScriptStepMatrix({ from: sp.get("from"), to: sp.get("to") });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка отчёта";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
