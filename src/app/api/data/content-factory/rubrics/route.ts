import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbDeleteRubric, dbListRubrics, dbReorderRubric, dbUpsertRubric } from "@/lib/server/contentFactoryDb";

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
    return NextResponse.json(await dbListRubrics());
  } catch (e) {
    return jsonErr(e, 401);
  }
}

// Создание/обновление рубрики: { id?, name, icon, color } или { id, direction: 'up'|'down' } для смены порядка.
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = await request.json();
    if (body?.direction === "up" || body?.direction === "down") {
      if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
      await dbReorderRubric(body.id, body.direction);
      return NextResponse.json({ ok: true });
    }
    if (!body?.name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
    const id = await dbUpsertRubric(body);
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
    await dbDeleteRubric(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
