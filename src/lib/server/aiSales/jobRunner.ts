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
 */
export async function drainQueue(timeBudgetMs = 40_000): Promise<DrainReport> {
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
    const [job] = await claimBatch(1);
    if (!job) break; // очередь пуста
    report.claimed += 1;

    const handler = handlers.get(job.type);
    if (!handler) {
      await failJob(job, `Нет обработчика для типа задачи: ${job.type}`);
      report.skipped += 1;
      continue;
    }
    try {
      const result = await handler(job);
      await completeJob(job.id, result);
      report.completed += 1;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await failJob(job, message);
      report.failed += 1;
    }
  }
  return report;
}
