import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbListLetterSends } from "@/lib/server/letterSendsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") || 200);
    const sends = await dbListLetterSends(Number.isFinite(limit) ? limit : 200);
    return NextResponse.json({ sends });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка БД";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
