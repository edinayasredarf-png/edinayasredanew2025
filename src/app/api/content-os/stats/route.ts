import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbContentOsStats } from "@/lib/server/contentOsDb";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    return NextResponse.json(await dbContentOsStats(getActiveCompanyId(request)));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status : 401;
    return NextResponse.json({ error: msg }, { status: st });
  }
}
