import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getQcData } from "@/lib/server/aiSales/reviewsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Сводка контроля качества: эталон руководителя vs оценка LLM. РОП/админ. */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const data = await getQcData();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка контроля качества";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
