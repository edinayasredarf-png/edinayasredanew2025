import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbDeleteTopic, dbListTopics, dbReorderTopic, dbUpsertTopic } from "@/lib/server/contentFactoryDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
    ? (e as { status: number }).status : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const sp = request.nextUrl.searchParams;
    const rows = await dbListTopics({
      status: sp.get("status") || undefined,
      rubric_id: sp.get("rubric_id") || undefined,
      q: sp.get("q") || undefined,
    });
    return NextResponse.json(rows);
  } catch (e) {
    return jsonErr(e, 401);
  }
}

// Создание/обновление темы, либо смена ручного порядка: { id, direction: 'up'|'down' }.
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = await request.json();
    if (body?.direction === "up" || body?.direction === "down") {
      if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await dbReorderTopic(body.id, body.direction);
      return NextResponse.json({ ok: true });
    }
    if (!body?.title?.trim()) return NextResponse.json({ error: "title required" }, { status: 400 });
    const id = await dbUpsertTopic(body);
    return NextResponse.json({ id });
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbDeleteTopic(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
