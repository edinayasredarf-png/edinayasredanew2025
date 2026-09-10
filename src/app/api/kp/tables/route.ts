import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteCalcTable,
  dbListCalcTables,
  dbUpsertCalcTable,
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
  const tables = await dbListCalcTables();
  return NextResponse.json({ tables });
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { key?: string; name?: string; columns?: unknown[]; isActive?: boolean; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.key?.trim() || !body.name?.trim()) {
    return NextResponse.json({ error: "Укажите ключ и название таблицы" }, { status: 400 });
  }
  if (!Array.isArray(body.columns) || body.columns.length === 0) {
    return NextResponse.json({ error: "Добавьте хотя бы одну колонку" }, { status: 400 });
  }
  try {
    await dbUpsertCalcTable({
      key: body.key,
      name: body.name,
      columns: body.columns,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Не указан key" }, { status: 400 });
  await dbDeleteCalcTable(key);
  return NextResponse.json({ ok: true });
}
