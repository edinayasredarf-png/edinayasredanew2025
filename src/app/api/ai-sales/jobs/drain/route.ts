import { NextRequest, NextResponse, after } from "next/server";
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

/** Максимальная глубина самопродолжения — предохранитель от бесконечной цепочки. */
const MAX_CHAIN = 40;

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
    // ~25с бюджета — укладываемся в тайм-аут внешних планировщиков (cron-job.org
    // = 30с) и в Hobby maxDuration. За вызов прожёвываем десятки страниц.
    const report = await drainQueue(25_000);
    const stats = await queueStats();

    // Самопродолжение: одна пачка тянет следующую, пока очередь не опустеет —
    // чтобы бэклог разгребался с одного запуска (крон/кнопка), а не по одной пачке.
    const chain = Number(new URL(request.url).searchParams.get("chain") || "0");
    const remaining = (stats.pending || 0) + (stats.retry || 0);
    const secret = process.env.CRON_SECRET?.trim();
    if (secret && remaining > 0 && report.claimed > 0 && chain < MAX_CHAIN) {
      const next = new URL(request.url);
      next.searchParams.set("chain", String(chain + 1));
      after(async () => {
        try {
          await fetch(next.toString(), {
            method: "GET",
            headers: { authorization: `Bearer ${secret}` },
          });
        } catch {
          /* следующую пачку подхватит крон */
        }
      });
    }

    return NextResponse.json({ ok: true, report, stats, chain });
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
