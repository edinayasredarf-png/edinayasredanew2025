import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getSignals } from "@/lib/server/aiSales/alertsService";
import { setSignalState, type SignalAction } from "@/lib/server/aiSales/signalStateDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // проверка активности сделок в Bitrix добавляет сетевых вызовов

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
    const data = await getSignals(null, { from: sp.get("from"), to: sp.get("to") }, sp.get("hidden") === "1");
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка сигналов";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Обработать сигнал: «готово» / «отложить на N дней» / «вернуть». */
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { signalId?: string; action?: SignalAction; days?: number };
    const action = body.action;
    if (!body.signalId || (action !== "done" && action !== "snooze" && action !== "restore")) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }
    await setSignalState(body.signalId, action, { days: body.days, updatedBy: user.email || user.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
