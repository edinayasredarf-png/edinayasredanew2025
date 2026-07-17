import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteItem,
  dbListItems,
  dbSetItemStatus,
} from "@/lib/server/radarDb";
import type { RadarStatus } from "@/lib/radarTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: RadarStatus[] = ["new", "interesting", "used", "lead", "dismissed"];

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st =
    typeof e === "object" && e !== null && "status" in e &&
    typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status
      : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const sp = request.nextUrl.searchParams;
    const rows = await dbListItems({
      category: sp.get("category") || undefined,
      status: sp.get("status") || undefined,
      q: sp.get("q") || undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    });
    return NextResponse.json(rows);
  } catch (e) {
    return jsonErr(e, 401);
  }
}

// Смена статуса новости: { id, status }
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = (await request.json()) as { id?: string; status?: string };
    if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (!body.status || !STATUSES.includes(body.status as RadarStatus)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    await dbSetItemStatus(body.id, body.status as RadarStatus);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbDeleteItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
