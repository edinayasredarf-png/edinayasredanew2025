import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/server/dataDb";

function jsonErr(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kind, slug } = body;
    if (kind !== "post" && kind !== "news") {
      return NextResponse.json({ error: "kind must be post|news" }, { status: 400 });
    }
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }
    await db.dbIncViews(kind, slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e);
  }
}
