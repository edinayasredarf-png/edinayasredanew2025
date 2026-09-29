import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbAddFactCheck, dbListFactChecks } from "@/lib/server/contentOsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
    ? (e as { status: number }).status : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
    const { id } = await params;
    return NextResponse.json(await dbListFactChecks(id));
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
    const { id } = await params;
    const body = await request.json();
    if (!body?.claim?.trim()) return NextResponse.json({ error: "claim required" }, { status: 400 });
    const factId = await dbAddFactCheck({ content_item_id: id, claim: body.claim, verdict: body.verdict || "unverified", source_url: body.source_url || "" });
    return NextResponse.json({ id: factId });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
