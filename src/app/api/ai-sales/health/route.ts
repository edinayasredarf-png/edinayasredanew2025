import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { getTimewebPool } from "@/lib/timewebPg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Диагностика БД речевой аналитики (только админ): соединения, долгие запросы, блокировки,
 * размеры основных таблиц, возраст последней обработанной задачи. Помогает понять,
 * почему админка тормозит (504 от nginx при тяжёлых выборках).
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только администратору" }, { status });
  }
  const pool = getTimewebPool();
  const client = await pool.connect();
  const out: Record<string, unknown> = {};
  try {
    await client.query("set statement_timeout = 6000");
    const t0 = Date.now();
    await client.query("select 1");
    out.pingMs = Date.now() - t0;

    const run = async (key: string, sql: string) => {
      const s = Date.now();
      try { out[key] = (await client.query(sql)).rows; }
      catch (e) { out[key] = { error: e instanceof Error ? e.message : String(e) }; }
      out[`${key}Ms`] = Date.now() - s;
    };

    await run("connections", `select state, count(*)::int n from pg_stat_activity where datname = current_database() group by state order by n desc`);
    await run("longRunning", `select pid, state, wait_event_type, (now() - query_start)::text as running, left(regexp_replace(query, '\\s+', ' ', 'g'), 140) as query
                                 from pg_stat_activity where datname = current_database() and state <> 'idle' and pid <> pg_backend_pid()
                                order by query_start asc limit 8`);
    await run("idleInTransaction", `select count(*)::int n, coalesce(max(now() - xact_start), interval '0')::text as oldest from pg_stat_activity
                                      where datname = current_database() and state like 'idle in transaction%'`);
    await run("ungrantedLocks", `select count(*)::int n from pg_locks where not granted`);
    await run("tables", `select relname as t, n_live_tup::bigint as rows, pg_size_pretty(pg_total_relation_size(relid)) as size,
                                n_dead_tup::bigint as dead, last_autovacuum
                           from pg_stat_user_tables where relname like 'ai_%' order by pg_total_relation_size(relid) desc limit 10`);
    await run("jobs", `select status, count(*)::int n, min(run_after) as oldest_due from ai_jobs group by status order by n desc`);
    await run("jobsByType", `select type, status, count(*)::int n from ai_jobs where status in ('PENDING','RETRY_PENDING','RUNNING') group by type, status order by n desc`);
    await run("lastDone", `select type, max(updated_at) as last_completed from ai_jobs where status = 'COMPLETED' group by type order by last_completed desc limit 6`);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка диагностики", partial: out }, { status: 500 });
  } finally {
    client.release();
  }
}
