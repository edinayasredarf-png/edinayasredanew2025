import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import {
  updateDepartment,
  setDepartmentPrompt,
  deleteDepartment,
} from "@/lib/server/aiSales/departmentsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Переименовать отдел, изменить порядок или задать промт анализа (РОП/админ). */
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
    const body = (await request.json().catch(() => ({}))) as {
      name?: string; sort?: number; analysisPrompt?: string | null;
    };
    if (body.name !== undefined || body.sort !== undefined) {
      await updateDepartment(id, { name: body.name, sort: body.sort });
    }
    if (body.analysisPrompt !== undefined) {
      await setDepartmentPrompt(id, body.analysisPrompt);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка обновления отдела";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Удалить отдел (РОП/админ). */
export async function DELETE(
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
    await deleteDepartment(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка удаления отдела";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
