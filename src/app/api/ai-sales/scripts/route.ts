import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess, requireRopAccess } from "@/lib/server/authFromBearer";
import { listScripts, createScript } from "@/lib/server/aiSales/scriptsDb";
import { listDepartmentOptions } from "@/lib/server/aiSales/departmentsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Активные скрипты (общий + по отделам) и список отделов для выбора. */
export async function GET(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const [scripts, departments] = await Promise.all([listScripts(), listDepartmentOptions()]);
    return NextResponse.json({ scripts, departments });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка скриптов";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Создать скрипт (общий при departmentId=null). РОП/админ. */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { departmentId?: string | null; name?: string };
    const id = await createScript(body.departmentId ?? null, body.name || "Скрипт продаж");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка создания скрипта";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
