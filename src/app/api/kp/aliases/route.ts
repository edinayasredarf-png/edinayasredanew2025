import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteCustomAlias,
  dbListAliases,
  dbUpsertCustomAlias,
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
  const aliases = await dbListAliases();
  return NextResponse.json({ aliases });
}

/** Создать/обновить пользовательский алиас {key,label,value}. */
export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { key?: string; label?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.key?.trim()) return NextResponse.json({ error: "Укажите ключ алиаса" }, { status: 400 });
  try {
    await dbUpsertCustomAlias(body.key, body.label || "", body.value || "");
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
  await dbDeleteCustomAlias(key);
  return NextResponse.json({ ok: true });
}
