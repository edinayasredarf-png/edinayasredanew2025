import { NextRequest, NextResponse } from "next/server";
import { getTimewebPool } from "@/lib/timewebPg";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Приёмник исходящих вебхуков Bitrix24 (события CRM/телефонии).
 * Отвечает БЫСТРО: только логирует событие (идемпотентно) и ставит задачу в
 * очередь. Никакого AI/тяжёлой работы внутри запроса (§60 ТЗ).
 *
 * Безопасность: Bitrix шлёт application_token в теле — сверяем с
 * BITRIX24_EVENT_TOKEN (задать в настройках исходящего вебхука Bitrix).
 * Bitrix отправляет данные как form-urlencoded (event[...]=...).
 */

function parseBitrixEvent(params: URLSearchParams): {
  event: string;
  entityId: string | null;
  token: string | null;
} {
  const event = params.get("event") || "";
  // Идентификатор сущности в разных форматах поля data.
  const entityId =
    params.get("data[FIELDS][ID]") ||
    params.get("data[FIELDS][id]") ||
    params.get("data[ID]") ||
    null;
  const token = params.get("auth[application_token]") || params.get("application_token") || null;
  return { event, entityId, token };
}

export async function POST(request: NextRequest) {
  const expected = process.env.BITRIX24_EVENT_TOKEN?.trim();

  let params: URLSearchParams;
  try {
    const body = await request.text();
    params = new URLSearchParams(body);
  } catch {
    return NextResponse.json({ ok: false, error: "bad body" }, { status: 400 });
  }

  const { event, entityId, token } = parseBitrixEvent(params);

  // Проверка токена (если настроен). Не раскрываем детали в ответе.
  if (expected && token !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!event) {
    return NextResponse.json({ ok: false, error: "no event" }, { status: 400 });
  }

  // Идемпотентность: журнал событий. Ключ — event + entityId (+ момент округляем).
  const externalEventId = `${event}:${entityId ?? "?"}`;
  const pool = getTimewebPool();
  await pool.query(
    `insert into ai_bitrix_events (external_event_id, event, entity_id, payload)
     values ($1,$2,$3,$4::jsonb)
     on conflict (external_event_id) do update set received_at = now(), processed = false`,
    [externalEventId, event, entityId, JSON.stringify(Object.fromEntries(params))]
  );

  // Маршрутизация события → задача очереди. Разбор — в дренаже, не здесь.
  const ev = event.toUpperCase();
  if (ev.includes("ONCRMACTIVITYADD") || ev.includes("ONCRMACTIVITYUPDATE")) {
    if (entityId) {
      await enqueueJob({
        type: "call.ingest",
        payload: { activityId: entityId },
        idempotencyKey: `ingest:activity:${entityId}`,
        priority: 40,
      });
    }
  } else if (ev.includes("ONCRMDEAL")) {
    await enqueueJob({
      type: "bitrix.sync",
      payload: { entity: "deals" },
      idempotencyKey: `sync:deals:webhook`,
      priority: 80,
    });
  }

  // Bitrix ждёт быстрый 200.
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // health / проверка URL при настройке вебхука в Bitrix.
  return NextResponse.json({ ok: true, endpoint: "bitrix-webhook" });
}
