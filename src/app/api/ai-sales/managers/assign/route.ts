import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { setManagerDepartment } from "@/lib/server/aiSales/departmentsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Привязать менеджера к отделу (departmentId=null — открепить). РОП/админ. */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as {
      bitrixUserId?: string; departmentId?: string | null;
    };
    if (!body.bitrixUserId) {
      return NextResponse.json({ error: "Не указан сотрудник" }, { status: 400 });
    }
    await setManagerDepartment(body.bitrixUserId, body.departmentId ?? null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка назначения отдела";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
