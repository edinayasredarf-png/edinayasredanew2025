import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/server/dataDb";
import { requireContentWriter } from "@/lib/server/authFromBearer";

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st =
    typeof e === "object" && e !== null && "status" in e &&
    typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

export async function GET() {
  try {
    const rows = await db.dbListPress();
    return NextResponse.json(rows, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    return jsonErr(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireContentWriter(request);
    const body = await request.json();
    if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.dbUpsertPress(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireContentWriter(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.dbDeletePress(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
