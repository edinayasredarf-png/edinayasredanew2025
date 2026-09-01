import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { drainQueue } from "@/lib/server/aiSales/jobRunner";
import { queueStats } from "@/lib/server/aiSales/jobsDb";
import { registerAllHandlers } from "@/lib/server/aiSales/handlers";

// Регистрируем обработчики при загрузке модуля (до дренажа очереди).
registerAllHandlers();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Дренаж очереди AI-задач. Два способа вызова (как radar/refresh):
 *  - Vercel Cron: заголовок Authorization: Bearer $CRON_SECRET;
 *  - вручную из админки: обычная админ-авторизация.
 *
 * Обработчики регистрируются на следующих этапах; сейчас очередь пуста —
 * роут возвращает статистику и корректно завершается.
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
    // ~45с бюджета (Hobby maxDuration до 60с) — за один вызов прожёвываем
    // много страниц синхронизации.
    const report = await drainQueue(45_000);
    const stats = await queueStats();
    return NextResponse.json({ ok: true, report, stats });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка дренажа очереди";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
