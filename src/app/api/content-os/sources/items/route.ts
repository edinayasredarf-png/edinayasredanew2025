import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbListSourceItems } from "@/lib/server/contentOsDb";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";
import type { ContentSourceItemStatus } from "@/lib/contentOsTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const sp = request.nextUrl.searchParams;
    const status = (sp.get("status") as ContentSourceItemStatus | null) ?? undefined;
    const sourceId = sp.get("sourceId") ?? undefined;
    return NextResponse.json(await dbListSourceItems({ status, sourceId, companyId: getActiveCompanyId(request) }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
