import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getAllSettings, setSetting, EDITABLE_KEYS } from "@/lib/server/aiSales/settingsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  try {
    return NextResponse.json({ settings: await getAllSettings(), editable: [...EDITABLE_KEYS] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка настроек";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Обновить настройки. Тело: { updates: { key: value, ... } }. Только whitelist. */
export async function PUT(request: NextRequest) {
  let user;
  try {
    user = await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  let body: { updates?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректное тело" }, { status: 400 });
  }
  const updates = body.updates || {};
  const applied: string[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (!EDITABLE_KEYS.has(key)) continue;
    await setSetting(key, value, user.id);
    applied.push(key);
  }
  return NextResponse.json({ ok: true, applied, settings: await getAllSettings() });
}
