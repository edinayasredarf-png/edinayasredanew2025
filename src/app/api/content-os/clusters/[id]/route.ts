import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetCluster } from "@/lib/server/contentOsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
    const { id } = await params;
    const cluster = await dbGetCluster(id);
    if (!cluster) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json(cluster);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
      ? (e as { status: number }).status : 401;
    return NextResponse.json({ error: msg }, { status: st });
  }
}
