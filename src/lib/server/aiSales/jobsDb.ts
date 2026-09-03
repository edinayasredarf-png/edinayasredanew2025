import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Очередь задач на PostgreSQL (§51 ТЗ, адаптировано под Vercel serverless).
 * Продюсер кладёт задачу (enqueue), Vercel Cron дренирует пачками (claimBatch)
 * через FOR UPDATE SKIP LOCKED — параллельные дренажи не берут одну задачу дважды.
 *
 * Идемпотентность: idempotencyKey UNIQUE — повторная постановка (например, тот же
 * вебхук Bitrix) не создаёт дубликат.
 */

export type AiJobType =
  | "bitrix.sync"
  | "call.ingest"
  | "call.transcribe"
  | "call.diarize"
  | "call.roles"
  | "call.analyze"
  | "deal.analyze"
  | "manager.analyze"
  | "ai.report"
  | "followup.check";

export type AiJobStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "RETRY_PENDING";

export interface AiJobRow {
  id: string;
  type: AiJobType;
  payload: Record<string, unknown>;
  status: AiJobStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  idempotency_key: string | null;
  run_after: Date;
  last_error: string | null;
  result: unknown;
  created_at: Date;
  updated_at: Date;
}

export interface EnqueueInput {
  type: AiJobType;
  payload?: Record<string, unknown>;
  priority?: number;
  maxAttempts?: number;
  idempotencyKey?: string;
  runAfter?: Date;
}

/** Поставить задачу. Возвращает id (существующей при совпадении idempotencyKey). */
export async function enqueueJob(input: EnqueueInput): Promise<string> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_jobs (type, payload, priority, max_attempts, idempotency_key, run_after)
     values ($1, $2::jsonb, $3, $4, $5, coalesce($6, now()))
     on conflict (idempotency_key) do update set idempotency_key = excluded.idempotency_key
     returning id`,
    [
      input.type,
      JSON.stringify(input.payload ?? {}),
      input.priority ?? 100,
      input.maxAttempts ?? 3,
      input.idempotencyKey ?? null,
      input.runAfter ?? null,
    ]
  );
  return rows[0].id;
}

/**
 * Вернуть в очередь задачи, застрявшие в RUNNING дольше maxMinutes (функция была
 * убита по таймауту serverless до completeJob/failJob). Без этого одна убитая
 * функция навсегда блокирует задачу. Вызывается перед claimBatch в дренаже.
 */
export async function reapStuckJobs(maxMinutes = 3): Promise<number> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query(
    `update ai_jobs
        set status = case when attempts < max_attempts then 'RETRY_PENDING' else 'FAILED' end,
            last_error = coalesce(last_error, 'reaped: stuck in RUNNING (timeout)'),
            run_after = now(),
            updated_at = now()
      where status = 'RUNNING'
        and locked_at < now() - ($1 || ' minutes')::interval`,
    [String(maxMinutes)]
  );
  return rowCount ?? 0;
}

/**
 * Атомарно забрать пачку готовых задач и пометить RUNNING.
 * SKIP LOCKED гарантирует, что параллельные воркеры/дренажи не пересекутся.
 */
export async function claimBatch(limit = 5): Promise<AiJobRow[]> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<AiJobRow>(
    `update ai_jobs j
        set status = 'RUNNING', locked_at = now(), attempts = attempts + 1, updated_at = now()
      where j.id in (
        select id from ai_jobs
         where status in ('PENDING','RETRY_PENDING')
           and run_after <= now()
         order by priority asc, run_after asc
         limit $1
         for update skip locked
      )
      returning j.*`,
    [limit]
  );
  return rows;
}

/** Успешное завершение задачи. */
export async function completeJob(
  id: string,
  result?: unknown
): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(
    `update ai_jobs set status = 'COMPLETED', result = $2::jsonb, last_error = null, updated_at = now()
      where id = $1`,
    [id, result === undefined ? null : JSON.stringify(result)]
  );
}

/**
 * Провал задачи. Пока не исчерпаны попытки — RETRY_PENDING с экспоненциальной
 * задержкой; иначе FAILED.
 */
export async function failJob(
  job: Pick<AiJobRow, "id" | "attempts" | "max_attempts">,
  error: string
): Promise<void> {
  const pool = getTimewebPool();
  const canRetry = job.attempts < job.max_attempts;
  const backoffSec = Math.min(3600, 30 * Math.pow(2, job.attempts)); // 30s,60s,120s…
  await pool.query(
    `update ai_jobs
        set status = $2,
            last_error = $3,
            run_after = case when $2 = 'RETRY_PENDING' then now() + ($4 || ' seconds')::interval else run_after end,
            updated_at = now()
      where id = $1`,
    [
      job.id,
      canRetry ? "RETRY_PENDING" : "FAILED",
      error.slice(0, 2000),
      String(backoffSec),
    ]
  );
}

export interface QueueStats {
  pending: number;
  running: number;
  failed: number;
  retry: number;
}

export async function queueStats(): Promise<QueueStats> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ status: AiJobStatus; n: string }>(
    `select status, count(*)::text as n from ai_jobs group by status`
  );
  const stats: QueueStats = { pending: 0, running: 0, failed: 0, retry: 0 };
  for (const r of rows) {
    if (r.status === "PENDING") stats.pending = Number(r.n);
    else if (r.status === "RUNNING") stats.running = Number(r.n);
    else if (r.status === "FAILED") stats.failed = Number(r.n);
    else if (r.status === "RETRY_PENDING") stats.retry = Number(r.n);
  }
  return stats;
}
