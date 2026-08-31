import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { bitrixConfigured } from "@/lib/server/bitrix";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";
import { getSyncState, type SyncEntity } from "@/lib/server/aiSales/syncDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Запуск синхронизации Bitrix → зеркала. Не выполняет выгрузку в HTTP-запросе,
 * а ставит задачу bitrix.sync в очередь (дренаж делает Cron).
 * GET — статус синхронизации; POST — поставить задачу (?entity=all|deals|...).
 */

const ENTITIES: SyncEntity[] = ["users", "companies", "contacts", "deals"];

export async function GET(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  const states = await Promise.all(ENTITIES.map((entity) => getSyncState(entity)));
  return NextResponse.json({ configured: bitrixConfigured(), states });
}

export async function POST(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  if (!bitrixConfigured()) {
    return NextResponse.json(
      { error: "BITRIX24_WEBHOOK_URL не задан" },
      { status: 503 }
    );
  }

  const entity = (request.nextUrl.searchParams.get("entity") as SyncEntity) || "all";
  const jobId = await enqueueJob({
    type: "bitrix.sync",
    payload: { entity },
    idempotencyKey: `sync:${entity}:manual`,
    priority: 60,
  });

  return NextResponse.json({ ok: true, jobId, entity });
}
