import "server-only";

import { fetchCallActivity } from "@/lib/server/bitrix/entities";
import { BitrixError } from "@/lib/server/bitrix/client";
import { upsertCallFromActivity } from "@/lib/server/aiSales/callsDb";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

/**
 * Ingestion звонка из CRM-активности Bitrix (подход рабочего n8n-пайплайна):
 *   activityId → crm.activity.get → извлечь запись (FILES[0] → disk.file.get)
 *              → upsert ai_calls → поставить задачу транскрипции (если есть запись).
 * Идемпотентно: upsert по bitrix_activity_id, задача транскрипции с idempotencyKey.
 */
export interface IngestResult {
  callId?: string;
  hasRecording: boolean;
  skipped?: string;
}

export async function ingestCallActivity(activityId: string, retry = 0): Promise<IngestResult> {
  let activity;
  try {
    activity = await fetchCallActivity(activityId);
  } catch (e) {
    // Событие ONCRMACTIVITYADD приходит на ЛЮБУЮ активность (задачи, письма, запланированные звонки),
    // многие из них Bitrix удаляет/заменяет сразу — crm.activity.get отвечает 400/404. Это не сбой
    // загрузки звонка: повторы бессмысленны, в «ошибки» не пишем, причина остаётся в результате задачи.
    if (e instanceof BitrixError && (e.httpStatus === 400 || e.httpStatus === 404)) {
      return { hasRecording: false, skipped: `активность недоступна в Bitrix: ${e.message.slice(0, 200)}` };
    }
    throw e;
  }

  // Реальный звонок = активность С ЗАПИСЬЮ. Задачи/планы «связаться» (без записи)
  // НЕ заводим как звонки — иначе в списке появляются фантомные «звонки» в будущем.
  if (!activity.recordingUrl) {
    // Запись к только что завершённому звонку прикрепляется с задержкой — перепроверим несколько раз (до ~20 мин).
    const isCall = String(activity.raw?.TYPE_ID ?? "") === "2";
    if (isCall && retry < 4) {
      await enqueueJob({
        type: "call.ingest", payload: { activityId, retry: retry + 1 }, priority: 45, maxAttempts: 2,
        runAfter: new Date(Date.now() + 5 * 60_000), idempotencyKey: `ingest:activity:${activityId}:retry:${retry + 1}`,
      });
    }
    return { hasRecording: false, skipped: "no recording (task/planned activity)" };
  }

  const callId = await upsertCallFromActivity(activity);
  await enqueueJob({
    type: "call.transcribe",
    payload: { callId },
    idempotencyKey: `transcribe:${callId}`,
    priority: 50,
  });
  return { callId, hasRecording: true };
}
