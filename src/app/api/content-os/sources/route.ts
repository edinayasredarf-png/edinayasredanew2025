import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbDeleteSource, dbListSources, dbUpsertSource } from "@/lib/server/contentOsDb";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";

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
    return NextResponse.json(await dbListSources(getActiveCompanyId(request)));
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = await request.json();
    if (!body?.name?.trim() || !body?.url?.trim() || !body?.type) {
      return NextResponse.json({ error: "name, url и type обязательны" }, { status: 400 });
    }
    const id = await dbUpsertSource(body, getActiveCompanyId(request));
    return NextResponse.json({ id });
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbDeleteSource(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
