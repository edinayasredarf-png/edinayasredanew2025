import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getTrends } from "@/lib/server/aiSales/trendsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Динамика во времени: недельные срезы + сравнение периода к периоду. */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const weeks = Number(request.nextUrl.searchParams.get("weeks")) || 12;
  try {
    const data = await getTrends(null, weeks);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка динамики";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
