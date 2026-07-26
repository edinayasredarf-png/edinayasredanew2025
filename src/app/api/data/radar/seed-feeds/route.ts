import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbEnsureDefaultFeeds } from "@/lib/server/radarDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const added = await dbEnsureDefaultFeeds();
    return NextResponse.json({ ok: true, added });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const st =
      typeof e === "object" && e !== null && "status" in e &&
      typeof (e as { status: unknown }).status === "number"
        ? (e as { status: number }).status
        : 500;
    return NextResponse.json({ error: msg }, { status: st });
  }
}
