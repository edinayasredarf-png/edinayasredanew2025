import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/server/dataDb";

function jsonErr(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await db.dbIncStoryViews(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e);
  }
}
