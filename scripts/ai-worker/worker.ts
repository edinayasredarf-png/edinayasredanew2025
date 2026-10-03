/**
 * ДЕКОММИШЕНЕН (2026-10) — VPS с self-hosted GigaChat удалена, этот воркер
 * сейчас НИГДЕ не запущен. Код оставлен в репозитории на случай, если
 * self-hosted CPU-инференс понадобится снова (см. git-историю ветки
 * cursor/yandex-gpt-drain-routing и scripts/ai-worker/README.md).
 *
 * ВАЖНО если решите поднять заново: src/app/api/ai-sales/jobs/drain/route.ts
 * сейчас БЕЗУСЛОВНО дренирует все типы задач, включая call.roles/
 * call.analyze/deal.analyze (т.к. предполагается быстрый облачный провайдер —
 * YandexGPT/Claude/Timeweb AI Gateway). Если этот воркер снова включат для
 * ДЕЙСТВИТЕЛЬНО медленного self-hosted CPU-инференса, нужно СНАЧАЛА вернуть
 * в route.ts условное исключение этих типов (см. git log той ветки — там
 * было getVercelDrainJobTypes/getVpsWorkerJobTypes, завязанные на ai.provider),
 * иначе Vercel и этот воркер будут claimBatch'ить одни и те же задачи.
 *
 * Обрабатывает задачи строго по одной (у self-hosted llama-server был один
 * слот генерации — параллельные запросы делили ресурсы и роняли друг друга
 * в timeout, проверено на практике).
 */
import { registerAllHandlers } from "@/lib/server/aiSales/handlers";
import { drainQueue, type JobEvent } from "@/lib/server/aiSales/jobRunner";
import { reapStuckJobs } from "@/lib/server/aiSales/jobsDb";
import { ANALYSIS_JOB_TYPES } from "@/lib/server/aiSales/settingsDb";
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
  const reapedOnStart = await reapStuckJobs(1, ANALYSIS_JOB_TYPES);
  log(`started, watching: ${ANALYSIS_JOB_TYPES.join(", ")}${reapedOnStart > 0 ? ` (очищено зависших от прошлого процесса: ${reapedOnStart})` : ""}`);
  while (!stopping) {
    try {
      const report = await drainQueue(DRAIN_BUDGET_MS, ANALYSIS_JOB_TYPES, onJob, REAP_MAX_MINUTES);
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
