import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbListItemsByChannel } from "@/lib/server/contentOsDb";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";
import type { ContentOsChannel } from "@/lib/contentOsTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const raw = request.nextUrl.searchParams.get("channel");
    if (!raw) return NextResponse.json({ error: "channel required" }, { status: 400 });
    const channels = raw.split(",") as ContentOsChannel[];
    return NextResponse.json(await dbListItemsByChannel(channels, getActiveCompanyId(request)));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status : 401;
    return NextResponse.json({ error: msg }, { status: st });
  }
}
