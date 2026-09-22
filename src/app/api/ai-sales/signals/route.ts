import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getSignals } from "@/lib/server/aiSales/alertsService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Проактивная лента «Сигналы РОПа»: что горит прямо сейчас + дайджест на утро. */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  try {
    const data = await getSignals(null, { from: sp.get("from"), to: sp.get("to") });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка сигналов";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
