import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Состояние сигналов РОПа: «сделано» / «отложить». Делает ленту «Сигналы»
 * рабочим инструментом, а не витриной — обработанное скрывается и не повторяется.
 *
 * Оба действия хранятся как snooze_until (дата, до которой сигнал скрыт):
 *  - «Готово»  → скрыть надолго (снова всплывёт, если проблема реально вернётся);
 *  - «Отложить»→ скрыть на N дней (напоминание позже).
 * Так мы не «глушим навсегда» сигнал, который может снова стать критичным.
 *
 * Таблица самосоздаётся (в проекте нет отдельного мигратора для AI-раздела).
 */

const DONE_DAYS = 30;

export type SignalAction = "done" | "snooze" | "restore";

export interface SignalState {
  status: "done" | "snoozed";
  snoozeUntil: string | null; // ISO
}

let ensured: Promise<void> | null = null;
function ensure(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const pool = getTimewebPool();
      await pool.query(
        `create table if not exists ai_signal_state (
           signal_id    text primary key,
           status       text not null,
           snooze_until timestamptz,
           updated_by   text,
           updated_at   timestamptz not null default now()
         )`
      );
    })().catch((e) => {
      ensured = null; // дать повторить попытку в следующем запросе
      throw e;
    });
  }
  return ensured;
}

/** Действующие «скрытия»: done (ещё не истёк) и snoozed (до snooze_until). */
export async function getActiveSignalStates(): Promise<Map<string, SignalState>> {
  const map = new Map<string, SignalState>();
  try {
    await ensure();
    const pool = getTimewebPool();
    const { rows } = await pool.query<{ signal_id: string; status: string; snooze_until: Date | null }>(
      `select signal_id, status, snooze_until
         from ai_signal_state
        where snooze_until is null or snooze_until > now()`
    );
    for (const r of rows) {
      map.set(r.signal_id, {
        status: r.status === "done" ? "done" : "snoozed",
        snoozeUntil: r.snooze_until ? r.snooze_until.toISOString() : null,
      });
    }
  } catch {
    /* таблица недоступна — считаем, что скрытий нет */
  }
  return map;
}

/** Отметить сигнал сделанным/отложенным или вернуть в ленту. */
export async function setSignalState(
  signalId: string,
  action: SignalAction,
  opts: { days?: number; updatedBy?: string | null } = {}
): Promise<void> {
  await ensure();
  const pool = getTimewebPool();
  const id = (signalId || "").trim();
  if (!id) throw new Error("Не указан сигнал");

  if (action === "restore") {
    await pool.query(`delete from ai_signal_state where signal_id = $1`, [id]);
    return;
  }
  const status = action === "done" ? "done" : "snoozed";
  const days = action === "done" ? DONE_DAYS : Math.max(1, Math.min(90, Math.round(opts.days ?? 3)));
  await pool.query(
    `insert into ai_signal_state (signal_id, status, snooze_until, updated_by, updated_at)
       values ($1, $2, now() + ($3 || ' days')::interval, $4, now())
     on conflict (signal_id) do update
        set status = excluded.status,
            snooze_until = excluded.snooze_until,
            updated_by = excluded.updated_by,
            updated_at = now()`,
    [id, status, String(days), opts.updatedBy ?? null]
  );
}
