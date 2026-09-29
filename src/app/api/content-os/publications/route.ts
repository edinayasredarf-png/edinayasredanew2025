import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbListPublications, dbUpsertPublication } from "@/lib/server/contentOsDb";

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
    return NextResponse.json(await dbListPublications());
  } catch (e) {
    return jsonErr(e, 401);
  }
}

// Публикация вручную (пока нет токенов каналов, см. integrations.md §3):
// редактор публикует сам на площадке и отмечает здесь как опубликовано.
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = await request.json();
    if (!body?.content_item_id || !body?.channel || !body?.status) {
      return NextResponse.json({ error: "content_item_id, channel и status обязательны" }, { status: 400 });
    }
    const id = await dbUpsertPublication(body);
    return NextResponse.json({ id });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
