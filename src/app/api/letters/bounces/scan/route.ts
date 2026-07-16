import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { scanBounces, isBounceScanConfigured } from "@/lib/server/bounceScan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Разбор возвратов. Два способа вызова:
 *  - из админки (кнопка «Обновить статусы») — обычная админ-авторизация;
 *  - по расписанию (Vercel Cron) — заголовок Authorization: Bearer $CRON_SECRET.
 */
function isCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
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

  if (!isBounceScanConfigured()) {
    return NextResponse.json(
      { error: "IMAP не настроен (IMAP_HOST / IMAP_USER / IMAP_PASS)" },
      { status: 503 }
    );
  }

  try {
    const result = await scanBounces();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка разбора возвратов";
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
