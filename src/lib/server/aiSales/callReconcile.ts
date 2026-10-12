import "server-only";

import { bitrixCall } from "@/lib/server/bitrix";
import { getTimewebPool } from "@/lib/timewebPg";

/**
 * Сверка звонков Bitrix с базой: звонки (TYPE_ID=2) за последние дни, у которых есть запись (FILES), но нет записи в ai_calls,
 * ставятся на загрузку (call.ingest). Страховка на случай потерянных/опоздавших событий вебхука (запись прикрепляется
 * к звонку позже самого события). Идемпотентно: ключ ingest:backfill:<id>.
 */
export interface ReconcileResult {
  days: number; dryRun: boolean; since: string; bitrixCallActivities: number; listComplete: boolean; inDatabase: number;
  missingTotal: number; missingWithRecording: number; filesFieldReturned: boolean; byDay: Record<string, number>; enqueued: number;
}

export async function reconcileCalls(opts: { days?: number; dryRun?: boolean; timeBudgetMs?: number } = {}): Promise<ReconcileResult> {
  const days = Math.min(60, Math.max(1, opts.days ?? 3));
  const dryRun = opts.dryRun !== false;
  const budget = opts.timeBudgetMs ?? 35_000;
  const pool = getTimewebPool();
  const sinceIso = `${new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)}T00:00:00+03:00`;

  type Act = { ID?: string; CREATED?: string; FILES?: unknown };
  const acts: Act[] = [];
  let start = 0;
  const t0 = Date.now();
  while (Date.now() - t0 < budget) {
    const { result, next } = await bitrixCall<Act[]>("crm.activity.list", {
      filter: { TYPE_ID: 2, ">=CREATED": sinceIso }, order: { ID: "ASC" }, select: ["ID", "CREATED", "FILES"], start,
    });
    acts.push(...(Array.isArray(result) ? result : []));
    if (next == null) break;
    start = next;
  }
  const listComplete = Date.now() - t0 < budget;

  const ids = acts.map((a) => String(a.ID)).filter(Boolean);
  const have = new Set<string>();
  for (let i = 0; i < ids.length; i += 500) {
    const { rows } = await pool.query<{ bitrix_activity_id: string }>(`select bitrix_activity_id from ai_calls where bitrix_activity_id = any($1::text[])`, [ids.slice(i, i + 500)]);
    for (const r of rows) have.add(r.bitrix_activity_id);
  }
  const missing = acts.filter((a) => a.ID && !have.has(String(a.ID)));
  // Запись есть, если вложение FILES ИЛИ ссылка на запись в телефонии (у части звонков вложение не прикрепляется).
  const voxIds = new Set<string>();
  try {
    let vstart = 0;
    while (Date.now() - t0 < budget) {
      const { result, next } = await bitrixCall<Array<Record<string, unknown>>>("voximplant.statistic.get", {
        FILTER: { ">=CALL_START_DATE": sinceIso }, SORT: "CALL_START_DATE", ORDER: "ASC", start: vstart,
      });
      for (const r of Array.isArray(result) ? result : []) if (r.CRM_ACTIVITY_ID && r.CALL_RECORD_URL) voxIds.add(String(r.CRM_ACTIVITY_ID));
      if (next == null) break;
      vstart = next;
    }
  } catch { /* телефония недоступна — считаем только по вложениям */ }
  const withRecording = missing.filter((a) => (Array.isArray(a.FILES) && a.FILES.length > 0) || voxIds.has(String(a.ID)));
  const byDay: Record<string, number> = {};
  for (const a of withRecording) { const d = String(a.CREATED ?? "").slice(0, 10); byDay[d] = (byDay[d] ?? 0) + 1; }

  let enqueued = 0;
  if (!dryRun && withRecording.length) {
    const r = await pool.query(
      `insert into ai_jobs (type, payload, priority, max_attempts, idempotency_key)
       select 'call.ingest', jsonb_build_object('activityId', x), 45, 2, 'ingest:backfill:' || x from unnest($1::text[]) as x
       on conflict (idempotency_key) do nothing`,
      [withRecording.map((a) => String(a.ID))]
    );
    enqueued = r.rowCount ?? 0;
  }
  return {
    days, dryRun, since: sinceIso, bitrixCallActivities: acts.length, listComplete, inDatabase: have.size,
    missingTotal: missing.length, missingWithRecording: withRecording.length, filesFieldReturned: acts.some((a) => a.FILES !== undefined), byDay, enqueued,
  };
}
