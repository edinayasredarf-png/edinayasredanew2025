import "server-only";

import { fetchCallActivity } from "@/lib/server/bitrix/entities";
import { upsertCallFromActivity } from "@/lib/server/aiSales/callsDb";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

/**
 * Ingestion звонка из CRM-активности Bitrix (подход рабочего n8n-пайплайна):
 *   activityId → crm.activity.get → извлечь запись (FILES[0] → disk.file.get)
 *              → upsert ai_calls → поставить задачу транскрипции (если есть запись).
 * Идемпотентно: upsert по bitrix_activity_id, задача транскрипции с idempotencyKey.
 */
export interface IngestResult {
  callId: string;
  hasRecording: boolean;
}

export async function ingestCallActivity(activityId: string): Promise<IngestResult> {
  const activity = await fetchCallActivity(activityId);
  const callId = await upsertCallFromActivity(activity);

  const hasRecording = Boolean(activity.recordingUrl);
  if (hasRecording) {
    await enqueueJob({
      type: "call.transcribe",
      payload: { callId },
      idempotencyKey: `transcribe:${callId}`,
      priority: 50,
    });
  }
  return { callId, hasRecording };
}
