import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { overrideScriptStep } from "@/lib/server/aiSales/scriptsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ручная правка оценки шага скрипта (если ИИ ошибся). Пересчитывает балл. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { key?: string; completed?: boolean };
    if (!body.key || typeof body.completed !== "boolean") {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }
    const updated = await overrideScriptStep(id, body.key, body.completed);
    if (!updated) return NextResponse.json({ error: "Оценка скрипта не найдена" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
