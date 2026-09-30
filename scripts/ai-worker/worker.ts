/**
 * VPS-воркер очереди AI Sales — call.roles / call.analyze / deal.analyze.
 * Тот же код обработчиков, что и Vercel (src/lib/server/aiSales/handlers.ts,
 * скопирован как есть), но без лимита 60с — эти три типа сняты с Vercel-
 * дренажа (см. src/app/api/ai-sales/jobs/drain/route.ts, VERCEL_JOB_TYPES).
 *
 * Обрабатывает задачи строго по одной (llama-server на этом же сервере
 * держит один слот — параллельные запросы только делят ресурсы и роняют
 * всех в timeout, уже проверено на практике).
 */
import { registerAllHandlers } from "@/lib/server/aiSales/handlers";
import { drainQueue, type JobEvent } from "@/lib/server/aiSales/jobRunner";
import { reapStuckJobs } from "@/lib/server/aiSales/jobsDb";
import { getVpsWorkerJobTypes } from "@/lib/server/aiSales/settingsDb";
const POLL_INTERVAL_MS = 5_000;
const DRAIN_BUDGET_MS = 6 * 60 * 60 * 1000; // drainQueue сам выходит, когда очередь опустеет — это просто верхний потолок на «зависшую» пачку
// Self-hosted LLM на CPU: одна задача легитимно занимает несколько минут
// (наблюдалось до ~8 мин с ретраями). Старый порог reapStuckJobs (3 мин,
// унаследован от Vercel-семантики) реапил ещё выполняющиеся задачи —
// см. src/lib/server/aiSales/jobsDb.ts reapStuckJobs.
const REAP_MAX_MINUTES = 30;

registerAllHandlers();

let stopping = false;
process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });

function log(msg: string): void {
  console.log(`${new Date().toISOString()} [ai-worker] ${msg}`);
}

function onJob(event: JobEvent): void {
  const callId = (event.job.payload as { callId?: string } | null)?.callId;
  const label = `${event.job.type} id=${event.job.id.slice(0, 8)}${callId ? ` звонок=${callId.slice(0, 8)}` : ""}`;
  if (event.phase === "start") {
    log(`→ старт: ${label}`);
  } else if (event.phase === "completed") {
    log(`✓ готово: ${label}`);
  } else {
    log(`✗ ${event.phase}: ${label} — ${event.error}`);
  }
}

async function main(): Promise<void> {
  // Всё, что осталось RUNNING к моменту старта — это чужой (убитый рестартом
  // или крашем) процесс, не наша текущая работа. Чистим сразу коротким
  // порогом, а не ждём до REAP_MAX_MINUTES — иначе такая запись «висит»
  // призраком в админке (Выполняется: N) до получаса после каждого рестарта.
  let jobTypes = await getVpsWorkerJobTypes();
  const reapedOnStart = jobTypes.length ? await reapStuckJobs(1, jobTypes) : 0;
  log(
    jobTypes.length
      ? `started, watching: ${jobTypes.join(", ")}${reapedOnStart > 0 ? ` (очищено зависших от прошлого процесса: ${reapedOnStart})` : ""}`
      : "started, ai.provider — облако (YandexGPT/Claude): анализ на Vercel, VPS idle"
  );
  while (!stopping) {
    try {
      jobTypes = await getVpsWorkerJobTypes();
      if (!jobTypes.length) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }
      const report = await drainQueue(DRAIN_BUDGET_MS, jobTypes, onJob, REAP_MAX_MINUTES);
      if (report.claimed > 0) {
        log(`batch: claimed=${report.claimed} completed=${report.completed} failed=${report.failed} reaped=${report.reaped}`);
      }
    } catch (e) {
      log(`drain error: ${e instanceof Error ? e.message : String(e)}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  log("stopped");
}

main().catch((e) => {
  console.error("[ai-worker] fatal:", e);
  process.exit(1);
});
