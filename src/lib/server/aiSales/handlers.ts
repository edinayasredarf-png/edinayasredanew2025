import "server-only";

import { registerJobHandler } from "@/lib/server/aiSales/jobRunner";
import { syncEntityPage, SYNC_ENTITIES } from "@/lib/server/aiSales/bitrixSyncService";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";
import { ingestCallActivity } from "@/lib/server/aiSales/callIngestService";
import { runTranscription } from "@/lib/server/aiSales/transcriptionService";
import { runAnalysis } from "@/lib/server/aiSales/analysisService";
import type { SyncEntity } from "@/lib/server/aiSales/syncDb";

/**
 * Регистрация обработчиков очереди. Импортируется на входных точках, которые
 * дренируют очередь (drain route) — до вызова drainQueue. Идемпотентно:
 * повторный импорт просто перезаписывает те же обработчики.
 *
 * Обработчики транскрипции/анализа регистрируются здесь же по мере готовности
 * (call.transcribe, call.analyze) — см. следующий шаг Этапа 1.
 */
let registered = false;

export function registerAllHandlers(): void {
  if (registered) return;
  registered = true;

  // Синхронизация CRM Bitrix → зеркала. Чанками по страницам (Hobby-таймаут).
  registerJobHandler("bitrix.sync", async (job) => {
    const entity = (job.payload.entity as SyncEntity | "all") || "all";

    // «all» — разложить на отдельные задачи по сущностям (каждая пойдёт по страницам).
    if (entity === "all") {
      for (const e of SYNC_ENTITIES) {
        await enqueueJob({ type: "bitrix.sync", payload: { entity: e, start: 0 }, priority: 70 });
      }
      return { fannedOut: SYNC_ENTITIES };
    }

    const start = typeof job.payload.start === "number" ? job.payload.start : 0;
    const res = await syncEntityPage(entity, start);
    // Есть следующая страница — доложить в очередь.
    if (res.next !== null) {
      await enqueueJob({ type: "bitrix.sync", payload: { entity, start: res.next }, priority: 70 });
    }
    return res;
  });

  // Ingestion звонка из активности Bitrix.
  registerJobHandler("call.ingest", async (job) => {
    const activityId = String(job.payload.activityId || "");
    if (!activityId) throw new Error("call.ingest: пустой activityId");
    return ingestCallActivity(activityId);
  });

  // Транскрипция (sync Whisper / async Yandex SpeechKit).
  registerJobHandler("call.transcribe", async (job) => {
    const callId = String(job.payload.callId || "");
    if (!callId) throw new Error("call.transcribe: пустой callId");
    return runTranscription({
      callId,
      operationId: job.payload.operationId ? String(job.payload.operationId) : undefined,
      polls: typeof job.payload.polls === "number" ? job.payload.polls : undefined,
    });
  });

  // AI-анализ звонка через Claude.
  registerJobHandler("call.analyze", async (job) => {
    const callId = String(job.payload.callId || "");
    if (!callId) throw new Error("call.analyze: пустой callId");
    return runAnalysis(callId, { force: Boolean(job.payload.force) });
  });
}
