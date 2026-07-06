import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  getEmailActivity,
  bitrixConfigured,
  EmailPeriod,
} from "@/lib/server/bitrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: EmailPeriod[] = [7, 30, 90];

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

  const raw = Number(request.nextUrl.searchParams.get("period"));
  const period: EmailPeriod = ALLOWED.includes(raw as EmailPeriod)
    ? (raw as EmailPeriod)
    : 30;

  try {
    const data = await getEmailActivity(period);
    return NextResponse.json(data);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502;
    const message = e instanceof Error ? e.message : "Ошибка Битрикс24";
    return NextResponse.json({ configured: true, error: message }, { status });
  }
}
