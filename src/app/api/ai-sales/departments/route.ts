import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess, requireRopAccess } from "@/lib/server/authFromBearer";
import {
  listDepartments,
  listDepartmentManagers,
  createDepartment,
} from "@/lib/server/aiSales/departmentsDb";
import { CALL_ANALYSIS_SYSTEM } from "@/lib/ai/prompts/callAnalysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Список отделов + все менеджеры (для распределения). */
export async function GET(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const [departments, managers] = await Promise.all([
      listDepartments(),
      listDepartmentManagers(),
    ]);
    return NextResponse.json({ departments, managers, defaultAnalysisPrompt: CALL_ANALYSIS_SYSTEM });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка отделов";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Создать отдел (РОП/админ). */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Укажите название отдела" }, { status: 400 });
    const id = await createDepartment(name);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка создания отдела";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
