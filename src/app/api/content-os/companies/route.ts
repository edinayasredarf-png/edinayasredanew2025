import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbDeactivateCompany, dbListCompanies, dbUpsertCompany } from "@/lib/server/contentOsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: msg }, { status: fallback });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const includeInactive = request.nextUrl.searchParams.get("includeInactive") === "1";
    return NextResponse.json(await dbListCompanies({ includeInactive }));
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return jsonErr(e, 401);
  }
  const body = await request.json().catch(() => ({}));
  if (!body?.name?.trim()) return NextResponse.json({ error: "name обязателен" }, { status: 400 });
  try {
    const id = await dbUpsertCompany(body);
    return NextResponse.json({ id });
  } catch (e) {
    return jsonErr(e);
  }
}

/** Мягкое удаление (is_active=false) — компания остаётся как company_id в уже созданных данных. */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return jsonErr(e, 401);
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await dbDeactivateCompany(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 400);
  }
}
