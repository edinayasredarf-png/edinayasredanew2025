import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/server/dataDb";

function jsonErr(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kind, id, type } = body;
    if (kind !== "post" && kind !== "news") {
      return NextResponse.json({ error: "kind must be post|news" }, { status: 400 });
    }
    if (!id || !type) {
      return NextResponse.json({ error: "id and type required" }, { status: 400 });
    }
    if (!["heart", "fire", "smile"].includes(type)) {
      return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }
    await db.dbIncReaction(kind, id, type);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const kind = request.nextUrl.searchParams.get("kind");
    const id = request.nextUrl.searchParams.get("id");
    if ((kind !== "post" && kind !== "news") || !id) {
      return NextResponse.json(
        { error: "kind (post|news) and id required" },
        { status: 400 }
      );
    }
    const reactions = await db.dbGetReactions(kind, id);
    return NextResponse.json(reactions);
  } catch (e) {
    return jsonErr(e);
  }
}
