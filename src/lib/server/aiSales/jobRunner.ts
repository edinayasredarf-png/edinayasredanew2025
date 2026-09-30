import "server-only";

import {
  claimBatch,
  completeJob,
  failJob,
  reapStuckJobs,
  type AiJobRow,
  type AiJobType,
} from "@/lib/server/aiSales/jobsDb";

/**
 * Реестр обработчиков задач. На Этапе 0 пуст — обработчики регистрируются на
 * последующих этапах (bitrix.sync, call.transcribe, call.analyze …).
 * Дренаж вызывается из Vercel Cron: он забирает пачку и исполняет обработчики.
 */

export type JobHandler = (job: AiJobRow) => Promise<unknown>;

const handlers = new Map<AiJobType, JobHandler>();

export function registerJobHandler(type: AiJobType, handler: JobHandler): void {
  handlers.set(type, handler);
}

export interface DrainReport {
  reaped: number;
  claimed: number;
  completed: number;
  failed: number;
  skipped: number; // нет обработчика
}

/**
 * Дренаж очереди с бюджетом времени. Забирает и исполняет задачи ПО ОДНОЙ в цикле,
 * пока не истечёт timeBudgetMs или очередь не опустеет. Так один вызов функции
 * прожёвывает много мелких задач (страниц синхронизации), укладываясь в лимит
 * времени serverless (Vercel Hobby ~60с). claim(1) + SKIP LOCKED → параллельные
 * дренажи не берут одну задачу дважды, зависших RUNNING не остаётся.
 *
 * `types` — см. claimBatch: белый список типов задач для этого вызова.
 * Vercel-дренаж передаёт быстрые типы, VPS-воркер (scripts/ai-worker) —
 * call.roles/call.analyze/deal.analyze с большим timeBudgetMs.
 *
 * `onJob` — опциональный хук на старт/финиш каждой отдельной задачи (не только
 * итог всей партии). Не передаётся из Vercel-роута (там счёт на тысячи мелких
 * задач вроде bitrix.sync — лишний шум в логах), но передаётся VPS-воркером,
 * где задачи единичные и медленные (минуты на CPU-инференс) — иначе со стороны
 * кажется, что процесс завис.
 */
export interface JobEvent {
  job: AiJobRow;
  phase: "start" | "completed" | "failed" | "skipped";
  error?: string;
}

export async function drainQueue(
  timeBudgetMs = 40_000,
  types?: AiJobType[],
  onJob?: (event: JobEvent) => void
): Promise<DrainReport> {
  const reaped = await reapStuckJobs(3);
  const report: DrainReport = {
    reaped,
    claimed: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  const deadline = Date.now() + timeBudgetMs;
  while (Date.now() < deadline) {
    const [job] = await claimBatch(1, types);
    if (!job) break; // очередь пуста
    report.claimed += 1;
    onJob?.({ job, phase: "start" });

    const handler = handlers.get(job.type);
    if (!handler) {
      const error = `Нет обработчика для типа задачи: ${job.type}`;
      await failJob(job, error);
      report.skipped += 1;
      onJob?.({ job, phase: "skipped", error });
      continue;
    }
    try {
      const result = await handler(job);
      await completeJob(job.id, result);
      report.completed += 1;
      onJob?.({ job, phase: "completed" });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await failJob(job, message);
      report.failed += 1;
      onJob?.({ job, phase: "failed", error: message });
    }
  }
  return report;
}
