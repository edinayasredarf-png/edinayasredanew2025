import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbUpdateCallInfo } from "@/lib/server/letterSendsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Правка данных по звонку: телефон, отметка «прозвонил», комментарий. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  let body: { phone?: unknown; called?: unknown; call_comment?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const patch: { phone?: string; called?: boolean; call_comment?: string } = {};
  if (typeof body.phone === "string") patch.phone = body.phone.trim().slice(0, 100);
  if (typeof body.called === "boolean") patch.called = body.called;
  if (typeof body.call_comment === "string") {
    patch.call_comment = body.call_comment.slice(0, 5000);
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Нечего обновлять" }, { status: 400 });
  }

  try {
    const row = await dbUpdateCallInfo(id, patch);
    if (!row) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, send: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка БД";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
