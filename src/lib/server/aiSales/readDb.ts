import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

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

function mgrClause(managerBitrixId: string | null, alias = "c"): { sql: string; params: string[] } {
  if (!managerBitrixId) return { sql: "", params: [] };
  return { sql: ` and ${alias}.bitrix_user_id = $1`, params: [managerBitrixId] };
}

export async function getDashboard(managerBitrixId: string | null): Promise<DashboardData> {
  const pool = getTimewebPool();
  const m = mgrClause(managerBitrixId);

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
    avg_deal: string | null; avg_mgr: string | null;
    hot: string; warm: string; cold: string; no_next: string;
  }>(
    `select
        avg(a.deal_score)::text as avg_deal,
        avg(a.manager_score)::text as avg_mgr,
        count(*) filter (where a.deal_temperature = 'HOT')::text as hot,
        count(*) filter (where a.deal_temperature = 'WARM')::text as warm,
        count(*) filter (where a.deal_temperature = 'COLD')::text as cold,
        count(*) filter (where a.next_step is null)::text as no_next
       from ai_call_analysis a
       join ai_calls c on c.id = a.call_id
      where true${m.sql}`,
    m.params
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
      avgManagerScore: round(aa?.avg_mgr ?? null, 1),
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
  companyTitle: string | null;
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
  managerBitrixId?: string | null; // RBAC
  temperature?: string | null;
  status?: string | null;
  limit?: number;
  offset?: number;
}

export async function listCalls(f: CallListFilters): Promise<{ items: CallListItem[]; total: number }> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();
  const where: string[] = ["true"];
  const params: unknown[] = [];
  let i = 1;

  if (f.managerBitrixId) { where.push(`c.bitrix_user_id = $${i++}`); params.push(f.managerBitrixId); }
  if (f.temperature) { where.push(`a.deal_temperature = $${i++}`); params.push(f.temperature); }
  if (f.status) { where.push(`c.status = $${i++}`); params.push(f.status); }

  const whereSql = where.join(" and ");
  const limit = Math.min(f.limit ?? 50, 200);
  const offset = f.offset ?? 0;

  const totalRes = await pool.query<{ n: string }>(
    `select count(*)::text as n
       from ai_calls c
       left join ai_call_analysis a on a.call_id = c.id
      where ${whereSql}`,
    params
  );

  const rows = await pool.query<{
    id: string; started_at: Date | null; manager_name: string | null; company_title: string | null;
    bitrix_deal_id: string | null; duration_sec: number | null; product: string | null;
    deal_score: number | null; manager_score: string | null; deal_temperature: string | null;
    result_type: string | null; next_step: string | null; status: string;
  }>(
    `select c.id, c.started_at, m.full_name as manager_name, co.title as company_title,
            c.bitrix_deal_id, c.duration_sec, c.product,
            a.deal_score, a.manager_score, a.deal_temperature, a.result_type, a.next_step, c.status
       from ai_calls c
       left join ai_call_analysis a on a.call_id = c.id
       left join ai_managers m on m.bitrix_user_id = c.bitrix_user_id
       left join ai_companies co on co.bitrix_company_id = c.bitrix_company_id
      where ${whereSql}
      order by c.started_at desc nulls last
      limit ${limit} offset ${offset}`,
    params
  );

  return {
    total: Number(totalRes.rows[0]?.n ?? 0),
    items: rows.rows.map((r) => ({
      id: r.id,
      startedAt: r.started_at ? r.started_at.toISOString() : null,
      managerName: r.manager_name,
      companyTitle: r.company_title,
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
  if (tr.rows[0]) {
    const seg = await pool.query<{
      idx: number; role: string | null; speaker_label: string | null; start_ms: number | null; text: string;
    }>(
      `select idx, role, speaker_label, start_ms, text from ai_transcript_segments where transcript_id = $1 order by idx asc`,
      [tr.rows[0].id]
    );
    transcript = {
      provider: tr.rows[0].provider,
      language: tr.rows[0].language,
      segments: seg.rows.map((s) => ({
        idx: s.idx, role: s.role, speakerLabel: s.speaker_label, startMs: s.start_ms, text: s.text,
      })),
    };
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
  };
}
