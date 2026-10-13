import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { listMeetingTypes, listMeetings } from "@/lib/server/aiSales/meetingsDb";
import { mtsConfigured } from "@/lib/server/mtsLink/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Список встреч (МТС Линк) + типы + признак настроенного ключа. Только РОП/админ. */
export async function GET(request: NextRequest) {
  try { await requireRopAccess(request); } catch (e) {
    return NextResponse.json({ error: "Нет доступа" }, { status: (e as { status?: number }).status ?? 401 });
  }
  const sp = request.nextUrl.searchParams;
  try {
    const [list, types] = await Promise.all([
      listMeetings({ status: sp.get("status"), typeId: sp.get("typeId"), q: sp.get("q"), limit: sp.get("limit") ? Number(sp.get("limit")) : 50, offset: sp.get("offset") ? Number(sp.get("offset")) : 0 }),
      listMeetingTypes(),
    ]);
    return NextResponse.json({ ...list, types, configured: mtsConfigured() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка списка встреч" }, { status: 500 });
  }
}
