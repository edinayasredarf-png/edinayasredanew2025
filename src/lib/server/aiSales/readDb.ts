import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";
import { computeConversationMetrics, type ConversationMetrics } from "@/lib/server/aiSales/conversationMetrics";

/**
 * Аналитические выборки для UI AI Sales. Агрегация — обычным SQL (не LLM, §45 ТЗ).
 * managerBitrixId — фильтр «менеджер видит только своё» (null → весь отдел).
 */

export interface DashboardData {
  calls: {
    total: number;
    analyzed: number;
    avgDurationSec: number | null;
    avgDealScore: number | null;
    avgManagerScore: number | null;
  };
  temperature: { hot: number; warm: number; cold: number };
  attention: {
    withoutNextStep: number;
    failed: number;
  };
  queue: { pending: number; running: number; failed: number; retry: number };
}

export interface DateRange {
  from?: string | null; // YYYY-MM-DD включительно
  to?: string | null;   // YYYY-MM-DD включительно
}

/** Фильтр по менеджеру + диапазону дат для звонков (по c.started_at). */
function callFilter(
  managerBitrixId: string | null,
  range?: DateRange,
  alias = "c"
): { sql: string; params: unknown[] } {
  const parts: string[] = [];
  const params: unknown[] = [];
  if (managerBitrixId) { params.push(managerBitrixId); parts.push(`${alias}.bitrix_user_id = $${params.length}`); }
  if (range?.from) { params.push(range.from); parts.push(`${alias}.started_at >= $${params.length}::date`); }
  if (range?.to) { params.push(range.to); parts.push(`${alias}.started_at < ($${params.length}::date + interval '1 day')`); }
  return { sql: parts.length ? ` and ${parts.join(" and ")}` : "", params };
}

export async function getDashboard(
  managerBitrixId: string | null,
  range?: DateRange
): Promise<DashboardData> {
  const pool = getTimewebPool();
  const m = callFilter(managerBitrixId, range);

  const callsAgg = await pool.query<{
    total: string; analyzed: string; avg_dur: string | null;
  }>(
    `select
        count(*)::text as total,
        count(*) filter (where status = 'COMPLETED')::text as analyzed,
        avg(duration_sec)::text as avg_dur
       from ai_calls c where true${m.sql}`,
    m.params
  );

  const analysisAgg = await pool.query<{
    avg_deal: string | null;
    hot: string; warm: string; cold: string; no_next: string;
  }>(
    `select
        avg(a.deal_score)::text as avg_deal,
        count(*) filter (where a.deal_temperature = 'HOT')::text as hot,
        count(*) filter (where a.deal_temperature = 'WARM')::text as warm,
        count(*) filter (where a.deal_temperature = 'COLD')::text as cold,
        count(*) filter (where a.next_step is null)::text as no_next
       from ai_call_analysis a
       join ai_calls c on c.id = a.call_id
      where true${m.sql}`,
    m.params
  );

  // Средняя оценка менеджера — по СДЕЛКАМ (справедливо: короткие звонки не тянут вниз).
  const dealParts: string[] = [];
  const dealParams: unknown[] = [];
  if (managerBitrixId) { dealParams.push(managerBitrixId); dealParts.push(`d.bitrix_user_id = $${dealParams.length}`); }
  if (range?.from) { dealParams.push(range.from); dealParts.push(`di.last_call_at >= $${dealParams.length}::date`); }
  if (range?.to) { dealParams.push(range.to); dealParts.push(`di.last_call_at < ($${dealParams.length}::date + interval '1 day')`); }
  const dealWhere = dealParts.length ? ` where ${dealParts.join(" and ")}` : "";
  const mgrAgg = await pool.query<{ avg_mgr: string | null }>(
    `select avg(di.manager_score)::text as avg_mgr
       from ai_deal_insights di
       join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id${dealWhere}`,
    dealParams
  );

  const failedAgg = await pool.query<{ failed: string }>(
    `select count(*) filter (where status = 'FAILED')::text as failed from ai_calls c where true${m.sql}`,
    m.params
  );

  const q = await pool.query<{ status: string; n: string }>(
    `select status, count(*)::text as n from ai_jobs group by status`
  );
  const queue = { pending: 0, running: 0, failed: 0, retry: 0 };
  for (const r of q.rows) {
    if (r.status === "PENDING") queue.pending = Number(r.n);
    else if (r.status === "RUNNING") queue.running = Number(r.n);
    else if (r.status === "FAILED") queue.failed = Number(r.n);
    else if (r.status === "RETRY_PENDING") queue.retry = Number(r.n);
  }

  const ca = callsAgg.rows[0];
  const aa = analysisAgg.rows[0];
  const round = (v: string | null, d = 1) => (v == null ? null : Number(Number(v).toFixed(d)));

  return {
    calls: {
      total: Number(ca?.total ?? 0),
      analyzed: Number(ca?.analyzed ?? 0),
      avgDurationSec: round(ca?.avg_dur ?? null, 0),
      avgDealScore: round(aa?.avg_deal ?? null, 0),
      avgManagerScore: round(mgrAgg.rows[0]?.avg_mgr ?? null, 1),
    },
    temperature: {
      hot: Number(aa?.hot ?? 0),
      warm: Number(aa?.warm ?? 0),
      cold: Number(aa?.cold ?? 0),
    },
    attention: {
      withoutNextStep: Number(aa?.no_next ?? 0),
      failed: Number(failedAgg.rows[0]?.failed ?? 0),
    },
    queue,
  };
}

export interface CallListItem {
  id: string;
  startedAt: string | null;
  managerName: string | null;
  companyTitle: string | null; // клиент (компания/контакт)
  phone: string | null;
  bitrixDealId: string | null;
  dealUrl: string | null;
  durationSec: number | null;
  product: string | null;
  dealScore: number | null;
  managerScore: number | null;
  temperature: string | null;
  resultType: string | null;
  nextStep: string | null;
  status: string;
}

export interface CallListFilters {
  managerBitrixId?: string | null; // RBAC (менеджер видит своё)
  managerFilter?: string | null;   // явный фильтр по менеджеру из UI
  temperature?: string | null;
  status?: string | null;
  tag?: string | null; // slug тега
  from?: string | null;
  to?: string | null;
  sort?: "asc" | "desc"; // по дате звонка
  limit?: number;
  offset?: number;
}

// Клиент: компания звонка → компания сделки → контакт (звонка/сделки).
const CALL_JOINS = `
   left join lateral (select * from ai_call_analysis aa where aa.call_id = c.id order by aa.created_at desc limit 1) a on true
   left join ai_managers m on m.bitrix_user_id = c.bitrix_user_id
   left join ai_deals d on d.bitrix_deal_id = c.bitrix_deal_id
   left join ai_companies co on co.bitrix_company_id = coalesce(c.bitrix_company_id, d.bitrix_company_id)
   left join ai_contacts ct on ct.bitrix_contact_id = coalesce(c.bitrix_contact_id, d.bitrix_contact_id)`;

export async function listCalls(f: CallListFilters): Promise<{ items: CallListItem[]; total: number }> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();
  const where: string[] = ["true"];
  const params: unknown[] = [];
  let i = 1;

  if (f.managerBitrixId) { where.push(`c.bitrix_user_id = $${i++}`); params.push(f.managerBitrixId); }
  if (f.managerFilter) { where.push(`c.bitrix_user_id = $${i++}`); params.push(f.managerFilter); }
  if (f.temperature) { where.push(`a.deal_temperature = $${i++}`); params.push(f.temperature); }
  if (f.status) { where.push(`c.status = $${i++}`); params.push(f.status); }
  if (f.from) { where.push(`c.started_at >= $${i++}::date`); params.push(f.from); }
  if (f.to) { where.push(`c.started_at < ($${i++}::date + interval '1 day')`); params.push(f.to); }
  if (f.tag) {
    where.push(`exists (select 1 from ai_call_tags cct join ai_tags tg on tg.id = cct.tag_id where cct.call_id = c.id and tg.slug = $${i++})`);
    params.push(f.tag);
  }

  const whereSql = where.join(" and ");
  const sort = f.sort === "asc" ? "asc" : "desc";
  const limit = Math.min(f.limit ?? 50, 200);
  const offset = f.offset ?? 0;

  const totalRes = await pool.query<{ n: string }>(
    `select count(*)::text as n from ai_calls c ${CALL_JOINS} where ${whereSql}`,
    params
  );

  const rows = await pool.query<{
    id: string; started_at: Date | null; manager_name: string | null; company_title: string | null;
    contact_name: string | null; phone_number: string | null;
    bitrix_deal_id: string | null; duration_sec: number | null; product: string | null;
    deal_score: number | null; manager_score: string | null; deal_temperature: string | null;
    result_type: string | null; next_step: string | null; status: string;
  }>(
    `select c.id, c.started_at, m.full_name as manager_name, co.title as company_title,
            ct.full_name as contact_name, c.phone_number,
            c.bitrix_deal_id, c.duration_sec, c.product,
            a.deal_score, a.manager_score, a.deal_temperature, a.result_type, a.next_step, c.status
       from ai_calls c ${CALL_JOINS}
      where ${whereSql}
      order by c.started_at ${sort} nulls last
      limit ${limit} offset ${offset}`,
    params
  );

  return {
    total: Number(totalRes.rows[0]?.n ?? 0),
    items: rows.rows.map((r) => ({
      id: r.id,
      startedAt: r.started_at ? r.started_at.toISOString() : null,
      managerName: r.manager_name,
      companyTitle: r.company_title || r.contact_name,
      phone: r.phone_number,
      bitrixDealId: r.bitrix_deal_id,
      dealUrl: r.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
      durationSec: r.duration_sec,
      product: r.product,
      dealScore: r.deal_score,
      managerScore: r.manager_score != null ? Number(r.manager_score) : null,
      temperature: r.deal_temperature,
      resultType: r.result_type,
      nextStep: r.next_step,
      status: r.status,
    })),
  };
}

export interface CallDetailData {
  call: {
    id: string;
    startedAt: string | null;
    durationSec: number | null;
    direction: string | null;
    status: string;
    product: string | null;
    recordingUrl: string | null;
    managerName: string | null;
    companyTitle: string | null;
    bitrixDealId: string | null;
    dealUrl: string | null;
  };
  transcript: {
    provider: string;
    language: string | null;
    segments: Array<{ idx: number; role: string | null; speakerLabel: string | null; startMs: number | null; text: string }>;
  } | null;
  analysis: Record<string, unknown> | null;
  metrics: ConversationMetrics | null;
}

export async function getCallDetail(callId: string): Promise<CallDetailData | null> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();

  const cr = await pool.query<{
    id: string; started_at: Date | null; duration_sec: number | null; direction: string | null;
    status: string; product: string | null; recording_url: string | null;
    manager_name: string | null; company_title: string | null; bitrix_deal_id: string | null;
  }>(
    `select c.id, c.started_at, c.duration_sec, c.direction, c.status, c.product, c.recording_url,
            m.full_name as manager_name, co.title as company_title, c.bitrix_deal_id
       from ai_calls c
       left join ai_managers m on m.bitrix_user_id = c.bitrix_user_id
       left join ai_companies co on co.bitrix_company_id = c.bitrix_company_id
      where c.id = $1`,
    [callId]
  );
  const call = cr.rows[0];
  if (!call) return null;

  const tr = await pool.query<{ id: string; provider: string; language: string | null }>(
    `select id, provider, language from ai_transcripts where call_id = $1`,
    [callId]
  );
  let transcript: CallDetailData["transcript"] = null;
  let metrics: ConversationMetrics | null = null;
  if (tr.rows[0]) {
    const seg = await pool.query<{
      idx: number; role: string | null; speaker_label: string | null; start_ms: number | null; end_ms: number | null; text: string;
    }>(
      `select idx, role, speaker_label, start_ms, end_ms, text from ai_transcript_segments where transcript_id = $1 order by idx asc`,
      [tr.rows[0].id]
    );
    transcript = {
      provider: tr.rows[0].provider,
      language: tr.rows[0].language,
      segments: seg.rows.map((s) => ({
        idx: s.idx, role: s.role, speakerLabel: s.speaker_label, startMs: s.start_ms, text: s.text,
      })),
    };
    metrics = computeConversationMetrics(
      seg.rows.map((s) => ({ role: s.role, text: s.text, startMs: s.start_ms, endMs: s.end_ms }))
    );
  }

  const an = await pool.query<{ data: Record<string, unknown> }>(
    `select data from ai_call_analysis where call_id = $1 order by created_at desc limit 1`,
    [callId]
  );

  return {
    call: {
      id: call.id,
      startedAt: call.started_at ? call.started_at.toISOString() : null,
      durationSec: call.duration_sec,
      direction: call.direction,
      status: call.status,
      product: call.product,
      recordingUrl: call.recording_url,
      managerName: call.manager_name,
      companyTitle: call.company_title,
      bitrixDealId: call.bitrix_deal_id,
      dealUrl: call.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${call.bitrix_deal_id}/` : null,
    },
    transcript,
    analysis: an.rows[0]?.data ?? null,
    metrics,
  };
}
