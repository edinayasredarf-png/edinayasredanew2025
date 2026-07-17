import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { refreshRadar } from "@/lib/server/radarFetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Обновление ленты «Новостного радара». Два способа вызова:
 *  - из админки (кнопка «Обновить») — обычная админ-авторизация;
 *  - по расписанию (Vercel Cron) — заголовок Authorization: Bearer $CRON_SECRET.
 */
function isCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return (request.headers.get("authorization") || "") === `Bearer ${secret}`;
}

async function handle(request: NextRequest) {
  if (!isCron(request)) {
    try {
      await requireAdminAccess(request);
    } catch (e) {
      const status = (e as { status?: number }).status ?? 401;
      return NextResponse.json({ error: "Нет доступа" }, { status });
    }
  }

  try {
    const result = await refreshRadar();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка обновления радара";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

// Vercel Cron дёргает GET
export async function GET(request: NextRequest) {
  return handle(request);
}
