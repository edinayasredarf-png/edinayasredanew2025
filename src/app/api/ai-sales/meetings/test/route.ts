import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { listRecords, mtsConfigured } from "@/lib/server/mtsLink/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Проверка подключения к МТС Линк: последние записи за 30 дней (поля — для сверки структуры ответа). */
export async function GET(request: NextRequest) {
  try { await requireRopAccess(request); } catch (e) {
    return NextResponse.json({ error: "Нет доступа" }, { status: (e as { status?: number }).status ?? 401 });
  }
  if (!mtsConfigured()) return NextResponse.json({ ok: false, configured: false, message: "Не задан MTS_LINK_API_KEY" });
  try {
    const recs = await listRecords({ from: new Date(Date.now() - 30 * 86400_000), limit: 5 });
    return NextResponse.json({
      ok: true, configured: true, found: recs.length,
      sample: recs.slice(0, 3).map((r) => ({ id: r.id, name: r.name, startedAt: r.startedAt, durationSec: r.durationSec, size: r.size, rawKeys: Object.keys(r.raw), eventSessionKeys: r.raw.eventSession && typeof r.raw.eventSession === "object" ? Object.keys(r.raw.eventSession as object) : [] })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, configured: true, message: e instanceof Error ? e.message : "Ошибка" }, { status: 502 });
  }
}
