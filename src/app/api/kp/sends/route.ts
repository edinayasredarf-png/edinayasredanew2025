import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbListLetterSends } from "@/lib/server/letterSendsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** История рассылок КП (из общей таблицы letter_sends, только template_key='kp'). */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const url = new URL(request.url);
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const limit = Number(url.searchParams.get("limit") || 500);
  const rows = await dbListLetterSends({ from, to, limit, templateKey: "kp" });
  return NextResponse.json({ rows });
}
