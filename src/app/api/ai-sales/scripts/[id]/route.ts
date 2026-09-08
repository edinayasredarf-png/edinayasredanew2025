import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { updateScript, type ScriptStep } from "@/lib/server/aiSales/scriptsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Обновить скрипт: имя и/или шаги (изменение шагов повышает версию). РОП/админ. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string; steps?: ScriptStep[] };
    await updateScript(id, { name: body.name, steps: body.steps });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка обновления скрипта";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
