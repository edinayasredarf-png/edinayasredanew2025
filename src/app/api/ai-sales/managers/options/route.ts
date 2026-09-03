import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { listManagerOptions } from "@/lib/server/aiSales/managersDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Лёгкий список менеджеров для фильтра (доступен ролям отдела). */
export async function GET(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    return NextResponse.json({ items: await listManagerOptions() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
