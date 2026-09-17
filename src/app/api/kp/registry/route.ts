import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbAddRegistryRow,
  dbDeleteRegistryRow,
  dbListRegistry,
  dbNextRegistryNumber,
  dbUpdateRegistryRow,
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
  const orgKey = new URL(request.url).searchParams.get("orgKey") || "";
  if (!orgKey) return NextResponse.json({ error: "Не указан orgKey" }, { status: 400 });
  const [rows, nextNumber] = await Promise.all([dbListRegistry(orgKey), dbNextRegistryNumber(orgKey)]);
  return NextResponse.json({ rows, nextNumber });
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { orgKey?: string; number?: number; letterDate?: string; addressee?: string; subject?: string; executor?: string; incomingNo?: string; incomingDate?: string; note?: string; replyTo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.orgKey?.trim()) return NextResponse.json({ error: "Не указана компания" }, { status: 400 });
  const res = await dbAddRegistryRow(body as { orgKey: string });
  return NextResponse.json({ ok: true, ...res });
}

export async function PATCH(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { id?: number; patch?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });
  await dbUpdateRegistryRow(body.id, (body.patch || {}) as never);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });
  await dbDeleteRegistryRow(id);
  return NextResponse.json({ ok: true });
}
