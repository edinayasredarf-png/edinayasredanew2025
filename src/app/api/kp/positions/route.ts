import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbAddPosition,
  dbDeletePosition,
  dbListPositions,
  dbRenamePosition,
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
  const positions = await dbListPositions();
  return NextResponse.json({ positions });
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Укажите должность" }, { status: 400 });
  await dbAddPosition(name);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { oldName?: string; newName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.oldName || !body.newName) {
    return NextResponse.json({ error: "Укажите старое и новое название" }, { status: 400 });
  }
  await dbRenamePosition(body.oldName, body.newName);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const name = new URL(request.url).searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Не указана должность" }, { status: 400 });
  await dbDeletePosition(name);
  return NextResponse.json({ ok: true });
}
