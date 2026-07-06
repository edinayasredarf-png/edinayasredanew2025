import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getEmailActivity, bitrixConfigured } from "@/lib/server/bitrix";
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

  if (!bitrixConfigured()) {
    return NextResponse.json({
      configured: false,
      error: "BITRIX24_WEBHOOK_URL не задан",
    });
  }

  const { from, to } = parseRange(
    request.nextUrl.searchParams.get("from"),
    request.nextUrl.searchParams.get("to")
  );

  try {
    const data = await getEmailActivity(from, to);
    return NextResponse.json(data);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    const message = e instanceof Error ? e.message : "Ошибка Битрикс24";
    return NextResponse.json({ configured: true, error: message }, { status });
  }
}
