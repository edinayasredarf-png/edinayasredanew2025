import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbListChannelProfiles, dbUpsertChannelProfile } from "@/lib/server/contentOsDb";

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
    return NextResponse.json(await dbListChannelProfiles());
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = await request.json();
    if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbUpsertChannelProfile(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
