import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

/**
 * Контроль качества LLM (§33 ТЗ): эталонные оценки руководителя vs оценки модели.
 * Метрики (MAE, смещение, корреляция Пирсона, доля близких) считаем в коде из
 * выборки, с разбивкой по версии промта — чтобы видеть эффект смены модели/промта.
 */

export interface CallReview {
  dealScore: number | null;
  managerScore: number | null;
  note: string | null;
}

/** Создать/обновить эталонную оценку звонка ревьюером. */
export async function upsertReview(input: {
  callId: string;
  reviewerId: string;
  reviewerEmail: string | null;
  dealScore: number | null;
  managerScore: number | null;
  note: string | null;
}): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(
    `insert into ai_call_reviews (call_id, reviewer_id, reviewer_email, deal_score, manager_score, note)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (call_id, reviewer_id) do update
        set deal_score = excluded.deal_score,
            manager_score = excluded.manager_score,
            note = excluded.note,
            reviewer_email = excluded.reviewer_email,
            updated_at = now()`,
    [input.callId, input.reviewerId, input.reviewerEmail, input.dealScore, input.managerScore, input.note]
  );
}

/** Эталонная оценка звонка конкретным ревьюером (для карточки). */
export async function getReview(callId: string, reviewerId: string): Promise<CallReview | null> {
  const pool = getTimewebPool();
  try {
    const { rows } = await pool.query<{ deal_score: number | null; manager_score: string | null; note: string | null }>(
      `select deal_score, manager_score, note from ai_call_reviews where call_id = $1 and reviewer_id = $2`,
      [callId, reviewerId]
    );
    const r = rows[0];
    if (!r) return null;
    return { dealScore: r.deal_score, managerScore: r.manager_score != null ? Number(r.manager_score) : null, note: r.note };
  } catch {
    return null; // таблица ещё не мигрирована
  }
}

export interface QcRow {
  callId: string;
  startedAt: string | null;
  managerName: string | null;
  clientTitle: string | null;
  reviewerEmail: string | null;
  humanDeal: number | null;
  humanManager: number | null;
  llmDeal: number | null;
  llmManager: number | null;
  promptVersion: string | null;
  model: string | null;
  dealUrl: string | null;
  leadUrl: string | null;
}

interface Metric { count: number; mae: number | null; bias: number | null; pearson: number | null; within: number | null }
export interface QcSummary {
  count: number;
  deal: Metric;    // within = доля |Δ|<=10 из 100
  manager: Metric; // within = доля |Δ|<=2 из 10
  byVersion: Array<{ promptVersion: string; count: number; dealMae: number | null; managerMae: number | null }>;
}

function pearson(pairs: Array<[number, number]>): number | null {
  const n = pairs.length;
  if (n < 3) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of pairs) { sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y; }
  const cov = n * sxy - sx * sy;
  const dx = Math.sqrt(n * sxx - sx * sx);
  const dy = Math.sqrt(n * syy - sy * sy);
  if (dx === 0 || dy === 0) return null;
  return Math.round((cov / (dx * dy)) * 100) / 100;
}

function metric(pairs: Array<[number, number]>, withinThreshold: number): Metric {
  const n = pairs.length;
  if (!n) return { count: 0, mae: null, bias: null, pearson: null, within: null };
  let ae = 0, se = 0, close = 0;
  for (const [h, l] of pairs) { ae += Math.abs(h - l); se += h - l; if (Math.abs(h - l) <= withinThreshold) close++; }
  return {
    count: n,
    mae: Math.round((ae / n) * 10) / 10,
    bias: Math.round((se / n) * 10) / 10,
    pearson: pearson(pairs),
    within: Math.round((close / n) * 100),
  };
}

/** Выборка оценённых звонков (эталон + последняя оценка LLM) и сводные метрики. */
export async function getQcData(): Promise<{ summary: QcSummary; rows: QcRow[] }> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();
  const { rows } = await pool.query<{
    call_id: string; started_at: Date | null; manager_name: string | null; company_title: string | null;
    contact_name: string | null; client_title: string | null; reviewer_email: string | null;
    human_deal: number | null; human_manager: string | null;
    llm_deal: number | null; llm_manager: string | null; prompt_version: string | null; model: string | null;
    bitrix_deal_id: string | null; bitrix_lead_id: string | null;
  }>(
    `select r.call_id, c.started_at, m.full_name as manager_name, co.title as company_title,
            ct.full_name as contact_name, c.client_title, r.reviewer_email,
            r.deal_score as human_deal, r.manager_score as human_manager,
            a.deal_score as llm_deal, a.manager_score as llm_manager, a.prompt_version, a.model,
            c.bitrix_deal_id, c.bitrix_lead_id
       from ai_call_reviews r
       join ai_calls c on c.id = r.call_id
       left join lateral (select * from ai_call_analysis aa where aa.call_id = c.id order by aa.created_at desc limit 1) a on true
       left join ai_managers m on m.bitrix_user_id = c.bitrix_user_id
       left join ai_deals d on d.bitrix_deal_id = c.bitrix_deal_id
       left join ai_companies co on co.bitrix_company_id = coalesce(c.bitrix_company_id, d.bitrix_company_id)
       left join ai_contacts ct on ct.bitrix_contact_id = coalesce(c.bitrix_contact_id, d.bitrix_contact_id)
      order by c.started_at desc nulls last`
  );

  const qcRows: QcRow[] = rows.map((r) => ({
    callId: r.call_id,
    startedAt: r.started_at ? r.started_at.toISOString() : null,
    managerName: r.manager_name,
    clientTitle: r.company_title || r.contact_name || r.client_title,
    reviewerEmail: r.reviewer_email,
    humanDeal: r.human_deal,
    humanManager: r.human_manager != null ? Number(r.human_manager) : null,
    llmDeal: r.llm_deal,
    llmManager: r.llm_manager != null ? Number(r.llm_manager) : null,
    promptVersion: r.prompt_version,
    model: r.model,
    dealUrl: r.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
    leadUrl: r.bitrix_lead_id && origin ? `${origin}/crm/lead/details/${r.bitrix_lead_id}/` : null,
  }));

  const dealPairs = qcRows.filter((r) => r.humanDeal != null && r.llmDeal != null).map((r) => [r.humanDeal!, r.llmDeal!] as [number, number]);
  const mgrPairs = qcRows.filter((r) => r.humanManager != null && r.llmManager != null).map((r) => [r.humanManager!, r.llmManager!] as [number, number]);

  // Разбивка по версии промта LLM.
  const versions = new Map<string, { deal: Array<[number, number]>; mgr: Array<[number, number]> }>();
  for (const r of qcRows) {
    const v = r.promptVersion || "—";
    if (!versions.has(v)) versions.set(v, { deal: [], mgr: [] });
    const bucket = versions.get(v)!;
    if (r.humanDeal != null && r.llmDeal != null) bucket.deal.push([r.humanDeal, r.llmDeal]);
    if (r.humanManager != null && r.llmManager != null) bucket.mgr.push([r.humanManager, r.llmManager]);
  }
  const byVersion = [...versions.entries()].map(([promptVersion, b]) => ({
    promptVersion,
    count: Math.max(b.deal.length, b.mgr.length),
    dealMae: b.deal.length ? metric(b.deal, 10).mae : null,
    managerMae: b.mgr.length ? metric(b.mgr, 2).mae : null,
  })).sort((a, b) => b.count - a.count);

  return {
    summary: {
      count: qcRows.length,
      deal: metric(dealPairs, 10),
      manager: metric(mgrPairs, 2),
      byVersion,
    },
    rows: qcRows,
  };
}
