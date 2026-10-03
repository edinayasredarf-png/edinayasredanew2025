import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbSetSourceItemStatus } from "@/lib/server/contentOsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 401 });
  }
  const { id } = await params;
  await dbSetSourceItemStatus(id, "dismissed");
  return NextResponse.json({ ok: true });
}
