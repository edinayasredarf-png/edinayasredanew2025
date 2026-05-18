import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/server/dataDb";
import { requireContentWriter } from "@/lib/server/authFromBearer";

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st =
    typeof e === "object" &&
    e !== null &&
    "status" in e &&
    typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status
      : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const row = await db.dbGetStoryById(id);
      return NextResponse.json(row);
    }
    const rows = await db.dbListStories();
    return NextResponse.json(rows);
  } catch (e) {
    return jsonErr(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireContentWriter(request);
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id required for upsert" }, { status: 400 });
    }
    await db.dbUpsertStory(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireContentWriter(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await db.dbDeleteStory(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
