import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  getMetrikaOverview,
  metrikaConfigured,
  MetrikaPeriod,
} from "@/lib/server/yandexMetrika";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PERIODS: MetrikaPeriod[] = [7, 30, 90];

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  if (!metrikaConfigured()) {
    return NextResponse.json({
      configured: false,
      error: "YANDEX_METRIKA_TOKEN не задан",
    });
  }

  const raw = Number(request.nextUrl.searchParams.get("period"));
  const period: MetrikaPeriod = ALLOWED_PERIODS.includes(raw as MetrikaPeriod)
    ? (raw as MetrikaPeriod)
    : 30;

  try {
    const overview = await getMetrikaOverview(period);
    return NextResponse.json({ configured: true, ...overview });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    const message = e instanceof Error ? e.message : "Ошибка Метрики";
    return NextResponse.json({ configured: true, error: message }, { status });
  }
}
