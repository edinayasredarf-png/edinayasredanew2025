import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getMetrikaOverview, metrikaConfigured } from "@/lib/server/yandexMetrika";
import { parseRange } from "@/lib/server/dateRange";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const { from, to } = parseRange(
    request.nextUrl.searchParams.get("from"),
    request.nextUrl.searchParams.get("to")
  );

  try {
    const overview = await getMetrikaOverview(from, to);
    return NextResponse.json({ configured: true, ...overview });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    const message = e instanceof Error ? e.message : "Ошибка Метрики";
    return NextResponse.json({ configured: true, error: message }, { status });
  }
}
