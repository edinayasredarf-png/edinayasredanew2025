import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteExecutor,
  dbListExecutors,
  dbUpsertExecutor,
  type KpExecutor,
} from "@/lib/server/kp/kpDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(request: NextRequest): Promise<NextResponse | null> {
  try {
    await requireAdminAccess(request);
    return null;
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
}

export async function GET(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const executors = await dbListExecutors();
  return NextResponse.json({ executors });
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: Partial<KpExecutor>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.fio?.trim()) return NextResponse.json({ error: "Укажите ФИО" }, { status: 400 });
  const id = await dbUpsertExecutor({
    id: body.id,
    fio: body.fio.trim(),
    phone: body.phone || "",
    email: body.email || "",
    isActive: body.isActive ?? true,
    sortOrder: body.sortOrder ?? 0,
  });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });
  await dbDeleteExecutor(id);
  return NextResponse.json({ ok: true });
}
