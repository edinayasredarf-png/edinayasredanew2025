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

/** Забрать и исполнить пачку задач. Ошибка одной задачи не валит остальные. */
export async function drainQueue(limit = 3): Promise<DrainReport> {
  // Сначала вернуть в очередь задачи, убитые таймаутом serverless.
  const reaped = await reapStuckJobs(3);
  const jobs = await claimBatch(limit);
  const report: DrainReport = {
    reaped,
    claimed: jobs.length,
    completed: 0,
    failed: 0,
    skipped: 0,
  };

  for (const job of jobs) {
    const handler = handlers.get(job.type);
    if (!handler) {
      // Нет обработчика — не считаем провалом, возвращаем в очередь как retry.
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
