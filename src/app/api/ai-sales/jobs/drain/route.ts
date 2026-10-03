import { NextRequest, NextResponse, after } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { drainQueue } from "@/lib/server/aiSales/jobRunner";
import { queueStats } from "@/lib/server/aiSales/jobsDb";
import { registerAllHandlers } from "@/lib/server/aiSales/handlers";
import { VERCEL_JOB_TYPES } from "@/lib/server/aiSales/settingsDb";

/**
 * Все типы задач дренируются здесь. Раньше call.roles/call.analyze/
 * deal.analyze при self-hosted AI (GigaChat на отдельной VPS, CPU-инференс —
 * минуты) не укладывались в 60с Hobby и уходили на отдельный воркер
 * (scripts/ai-worker). VPS с GigaChat удалена (2026-10) — self-hosted теперь
 * означает облачный OpenAI-совместимый шлюз (Timeweb AI Gateway и т.п.),
 * обычный быстрый API, так что отдельный воркер больше не нужен.
 */

// Регистрируем обработчики при загрузке модуля (до дренажа очереди).
registerAllHandlers();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  // Заголовок (Vercel Cron, самопродолжение) ИЛИ query-параметр ?key= —
  // чтобы внешний планировщик (cron-job.org) можно было настроить одним URL.
  if ((request.headers.get("authorization") || "") === `Bearer ${secret}`) return true;
  const q = new URL(request.url).searchParams;
  return q.get("key") === secret || q.get("secret") === secret;
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
    // ~18с бюджета на сам drainQueue — у cron-job.org жёсткий потолок тайм-аута
    // 30с (не настраивается выше, проверено на практике), и к бюджету
    // добавляются reapStuckJobs/queueStats/сериализация ответа/сетевая
    // задержка — с 25с суммарное время вызова иногда вылезало за 30с и
    // внешний крон считал запрос проваленным по тайм-ауту, даже когда сам
    // дренаж на сервере отрабатывал нормально.
    const report = await drainQueue(18_000, VERCEL_JOB_TYPES);
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
