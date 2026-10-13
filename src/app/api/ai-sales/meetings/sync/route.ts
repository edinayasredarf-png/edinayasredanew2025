import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { syncMeetings } from "@/lib/server/aiSales/meetingService";
import { mtsConfigured } from "@/lib/server/mtsLink/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Подтянуть записи встреч из МТС Линк сейчас: { days } (по умолчанию 7). Новые идут в обработку. */
export async function POST(request: NextRequest) {
  try { await requireRopAccess(request); } catch (e) {
    return NextResponse.json({ error: "Нет доступа" }, { status: (e as { status?: number }).status ?? 401 });
  }
  if (!mtsConfigured()) return NextResponse.json({ error: "Не задан MTS_LINK_API_KEY (ключ API МТС Линк) в переменных окружения" }, { status: 400 });
  const { days } = (await request.json().catch(() => ({}))) as { days?: number };
  try {
    return NextResponse.json({ ok: true, ...(await syncMeetings({ days: days ?? 7 })) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка синхронизации" }, { status: 502 });
  }
}
