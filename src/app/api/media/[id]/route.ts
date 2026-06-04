import { NextRequest, NextResponse } from "next/server";
import { dbGetEditorMedia } from "@/lib/server/dataDb";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 });
    }

    const row = await dbGetEditorMedia(id);
    if (!row) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(row.data), {
      status: 200,
      headers: {
        "Content-Type": row.mimeType,
        "Content-Length": String(row.sizeBytes),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
