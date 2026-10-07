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
  | "followup.check"
  | "brief.scan"
  | "brief.lead"
  | "brief.deal"
  | "notify.coach";

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
 *
 * `types` — тот же фильтр, что и в claimBatch. Обязателен для Vercel-дренажа:
 * без него Vercel (дренаж каждые ~минуту по cron-job.org) реапил бы чужие
 * call.roles/call.analyze/deal.analyze прямо во время их обработки VPS-
 * воркером — self-hosted LLM на CPU легитимно занимает несколько минут на
 * задачу, что больше старого порога в 3 минуты (проверено на практике:
 * реап рвал ещё выполняющиеся задачи ровно так).
 */
export async function reapStuckJobs(maxMinutes = 3, types?: AiJobType[]): Promise<number> {
  const pool = getTimewebPool();
  const params: unknown[] = [String(maxMinutes)];
  let typeFilter = "";
  if (types && types.length > 0) {
    params.push(types);
    typeFilter = `and type = any($2::text[])`;
  }
  const { rowCount } = await pool.query(
    `update ai_jobs
        set status = case when attempts < max_attempts then 'RETRY_PENDING' else 'FAILED' end,
            last_error = coalesce(last_error, 'reaped: stuck in RUNNING (timeout)'),
            run_after = now(),
            updated_at = now()
      where status = 'RUNNING'
        and locked_at < now() - ($1 || ' minutes')::interval
        ${typeFilter}`,
    params
  );
  return rowCount ?? 0;
}

/**
 * Атомарно забрать пачку готовых задач и пометить RUNNING.
 * SKIP LOCKED гарантирует, что параллельные воркеры/дренажи не пересекутся.
 *
 * `types` — опциональный фильтр (белый список). Используется, чтобы развести
 * Vercel-дренаж (быстрые задачи, ограничен 60с на Hobby) и VPS-воркер
 * (call.roles/call.analyze/deal.analyze — долгая локальная модель, без лимита
 * времени) так, чтобы они не претендовали на одни и те же задачи — см.
 * scripts/ai-worker/README.md.
 */
export async function claimBatch(
  limit = 5,
  types?: AiJobType[],
  opts: { allowBrief?: boolean } = {}
): Promise<AiJobRow[]> {
  const pool = getTimewebPool();
  const params: unknown[] = [limit];
  let typeFilter = "";
  if (types && types.length > 0) {
    params.push(types);
    typeFilter = `and type = any($2::text[])`;
  }
  // Брифы (поиск в интернете + сборка, до ~55 с на задачу) не должны мешать конвейеру звонков
  // (загрузка → транскрибация → роли → анализ → разбор сделки):
  //  - не больше BRIEF_MAX_PARALLEL брифов одновременно (по умолчанию 1);
  //  - брать бриф можно только в начале вызова дренажа (allowBrief), иначе он не уложится в лимит 60 с.
  const briefMax = Math.max(1, Number(process.env.BRIEF_MAX_PARALLEL) || 1);
  const briefFilter =
    opts.allowBrief === false
      ? `and type not like 'brief.%'`
      : `and (type not like 'brief.%' or (select count(*) from ai_jobs r where r.status = 'RUNNING' and r.type like 'brief.%') < ${briefMax})`;
  typeFilter += ` ${briefFilter}`;
  const { rows } = await pool.query<AiJobRow>(
    `update ai_jobs j
        set status = 'RUNNING', locked_at = now(), attempts = attempts + 1, updated_at = now()
      where j.id in (
        select id from ai_jobs
         where status in ('PENDING','RETRY_PENDING')
           and run_after <= now()
           ${typeFilter}
         order by priority asc, run_after asc
         limit $1
         for update skip locked
      )
      returning j.*`,
    params
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

/* ─────────── Детальная очередь (для панели «Очередь обработки») ─────────── */

export interface QueueJob {
  id: string;
  type: AiJobType;
  status: AiJobStatus;
  attempts: number;
  maxAttempts: number;
  payload: Record<string, unknown>;
  lastError: string | null;
  runAfter: string;
  updatedAt: string;
}

export interface QueueByType {
  type: AiJobType;
  count: number;
}

export interface QueueDetails {
  stats: QueueStats;
  running: QueueJob[];
  pending: QueueJob[];
  failed: QueueJob[];
  byType: QueueByType[];
}

function mapJob(r: {
  id: string; type: AiJobType; status: AiJobStatus; attempts: number; max_attempts: number;
  payload: Record<string, unknown> | null; last_error: string | null; run_after: Date; updated_at: Date;
}): QueueJob {
  return {
    id: r.id,
    type: r.type,
    status: r.status,
    attempts: r.attempts,
    maxAttempts: r.max_attempts,
    payload: r.payload ?? {},
    lastError: r.last_error,
    runAfter: r.run_after instanceof Date ? r.run_after.toISOString() : String(r.run_after),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  };
}

/** Полная картина очереди: что выполняется, что ждёт (по типам) и что упало. */
export async function queueDetails(): Promise<QueueDetails> {
  const pool = getTimewebPool();
  const [stats, running, pending, failed, byType] = await Promise.all([
    queueStats(),
    pool.query(
      `select id, type, status, attempts, max_attempts, payload, last_error, run_after, updated_at
         from ai_jobs where status = 'RUNNING'
        order by updated_at desc limit 50`
    ),
    pool.query(
      `select id, type, status, attempts, max_attempts, payload, last_error, run_after, updated_at
         from ai_jobs where status in ('PENDING','RETRY_PENDING')
        order by priority asc, run_after asc limit 50`
    ),
    pool.query(
      `select id, type, status, attempts, max_attempts, payload, last_error, run_after, updated_at
         from ai_jobs where status = 'FAILED'
        order by updated_at desc limit 50`
    ),
    pool.query<{ type: AiJobType; n: string }>(
      `select type, count(*)::text as n from ai_jobs
        where status in ('PENDING','RETRY_PENDING')
        group by type order by count(*) desc`
    ),
  ]);
  return {
    stats,
    running: running.rows.map(mapJob),
    pending: pending.rows.map(mapJob),
    failed: failed.rows.map(mapJob),
    byType: byType.rows.map((r) => ({ type: r.type, count: Number(r.n) })),
  };
}

/**
 * Удалить записи о задачах в статусе FAILED старше N дней (0 — все ошибочные).
 * Только FAILED: ожидающие, выполняющиеся и повторяемые задачи не затрагиваются.
 */
export async function purgeFailedJobs(olderThanDays: number): Promise<number> {
  const days = Math.max(0, Math.floor(olderThanDays));
  const { rowCount } = await getTimewebPool().query(
    `delete from ai_jobs where status = 'FAILED' and updated_at < now() - ($1 || ' days')::interval`,
    [String(days)]
  );
  return rowCount ?? 0;
}
