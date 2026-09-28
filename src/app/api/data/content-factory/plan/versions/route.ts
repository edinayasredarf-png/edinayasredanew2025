import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbDeletePlanVersion, dbListPlanVersions, dbUpsertPlanVersion } from "@/lib/server/contentFactoryDb";

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
    const planId = request.nextUrl.searchParams.get("plan_id");
    if (!planId) return NextResponse.json({ error: "plan_id required" }, { status: 400 });
    return NextResponse.json(await dbListPlanVersions(planId));
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = await request.json();
    if (!body?.plan_id || !body?.platform_id) {
      return NextResponse.json({ error: "plan_id and platform_id required" }, { status: 400 });
    }
    const id = await dbUpsertPlanVersion(body);
    return NextResponse.json({ id });
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const sp = request.nextUrl.searchParams;
    const planId = sp.get("plan_id");
    const platformId = sp.get("platform_id");
    if (!planId || !platformId) return NextResponse.json({ error: "plan_id and platform_id required" }, { status: 400 });
    await dbDeletePlanVersion(planId, platformId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
