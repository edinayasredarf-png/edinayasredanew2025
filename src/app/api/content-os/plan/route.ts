import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbListItemsScheduled } from "@/lib/server/contentOsDb";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const sp = request.nextUrl.searchParams;
    const from = sp.get("from") ? Number(sp.get("from")) : undefined;
    const to = sp.get("to") ? Number(sp.get("to")) : undefined;
    return NextResponse.json(await dbListItemsScheduled({ from, to, companyId: getActiveCompanyId(request) }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status : 401;
    return NextResponse.json({ error: msg }, { status: st });
  }
}
