import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { deleteMeetingType, listMeetingTypes, saveMeetingType } from "@/lib/server/aiSales/meetingsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(request: NextRequest) {
  try { await requireRopAccess(request); return null; } catch (e) {
    return NextResponse.json({ error: "Нет доступа" }, { status: (e as { status?: number }).status ?? 401 });
  }
}

export async function GET(request: NextRequest) {
  const d = await guard(request); if (d) return d;
  return NextResponse.json({ types: await listMeetingTypes() });
}

/** Создать/обновить тип встречи: { id?, name, description, keywords, prompt, steps (строки), isDefault }. */
export async function POST(request: NextRequest) {
  const d = await guard(request); if (d) return d;
  const b = (await request.json().catch(() => ({}))) as { id?: string; name?: string; description?: string; keywords?: string[] | string; prompt?: string; steps?: unknown; isDefault?: boolean };
  if (!b.name?.trim()) return NextResponse.json({ error: "Укажите название типа встречи" }, { status: 400 });
  if (!b.prompt?.trim()) return NextResponse.json({ error: "Укажите промт анализа" }, { status: 400 });
  const id = await saveMeetingType({ id: b.id, name: b.name, description: b.description, keywords: b.keywords, prompt: b.prompt, steps: b.steps, isDefault: b.isDefault });
  return NextResponse.json({ ok: true, id, types: await listMeetingTypes() });
}

export async function DELETE(request: NextRequest) {
  const d = await guard(request); if (d) return d;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Нужен id" }, { status: 400 });
  await deleteMeetingType(id);
  return NextResponse.json({ ok: true, types: await listMeetingTypes() });
}
