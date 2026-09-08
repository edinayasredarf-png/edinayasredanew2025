import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

/**
 * Полнотекстовый поиск по репликам транскриптов (§32 ТЗ). FTS (russian) как
 * основной, триграммный ILIKE как фолбэк для коротких/редких фраз. Возвращает
 * совпавшие реплики с тайм-кодом и контекстом звонка — для перехода к моменту.
 */

export interface SearchFilters {
  query: string;
  managerBitrixId?: string | null; // RBAC
  managerFilter?: string | null;
  department?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: number;
}

export interface SearchMatch {
  callId: string;
  segmentIdx: number;
  role: string | null;
  startMs: number | null;
  snippet: string;   // с подсветкой «…»
  text: string;
  startedAt: string | null;
  managerName: string | null;
  clientTitle: string | null;
  phone: string | null;
  dealUrl: string | null;
  leadUrl: string | null;
}

export async function searchTranscripts(f: SearchFilters): Promise<{ matches: SearchMatch[]; total: number }> {
  const q = (f.query || "").trim();
  if (!q) return { matches: [], total: 0 };

  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();
  const params: unknown[] = [];
  let i = 1;

  const pQ = i++; params.push(q);
  const pLike = i++; params.push(`%${q.toLowerCase()}%`);

  const where: string[] = [
    `(s.tsv @@ websearch_to_tsquery('russian', $${pQ}) or lower(s.text) like $${pLike})`,
  ];
  if (f.managerBitrixId) { where.push(`c.bitrix_user_id = $${i}`); params.push(f.managerBitrixId); i++; }
  if (f.managerFilter) { where.push(`c.bitrix_user_id = $${i}`); params.push(f.managerFilter); i++; }
  if (f.department) { where.push(`m.department_id = $${i}`); params.push(f.department); i++; }
  if (f.from) { where.push(`c.started_at >= $${i}::date`); params.push(f.from); i++; }
  if (f.to) { where.push(`c.started_at < ($${i}::date + interval '1 day')`); params.push(f.to); i++; }

  const whereSql = where.join(" and ");
  const limit = Math.min(f.limit ?? 100, 300);

  const joins = `
     join ai_transcripts t on t.id = s.transcript_id
     join ai_calls c on c.id = t.call_id
     left join ai_deals d on d.bitrix_deal_id = c.bitrix_deal_id
     left join ai_managers m on m.bitrix_user_id = c.bitrix_user_id
     left join ai_companies co on co.bitrix_company_id = coalesce(c.bitrix_company_id, d.bitrix_company_id)
     left join ai_contacts ct on ct.bitrix_contact_id = coalesce(c.bitrix_contact_id, d.bitrix_contact_id)`;

  const totalRes = await pool.query<{ n: string }>(
    `select count(*)::text as n from ai_transcript_segments s ${joins} where ${whereSql}`,
    params
  );

  const rows = await pool.query<{
    call_id: string; idx: number; role: string | null; start_ms: number | null; text: string; snippet: string;
    started_at: Date | null; manager_name: string | null; company_title: string | null;
    contact_name: string | null; client_title: string | null; phone_number: string | null;
    bitrix_deal_id: string | null; bitrix_lead_id: string | null;
  }>(
    `select t.call_id, s.idx, s.role, s.start_ms, s.text,
            ts_headline('russian', s.text, websearch_to_tsquery('russian', $${pQ}),
              'StartSel=[[,StopSel=]],MaxFragments=1,MinWords=4,MaxWords=16,ShortWord=2') as snippet,
            c.started_at, m.full_name as manager_name, co.title as company_title,
            ct.full_name as contact_name, c.client_title, c.phone_number,
            c.bitrix_deal_id, c.bitrix_lead_id
       from ai_transcript_segments s ${joins}
      where ${whereSql}
      order by c.started_at desc nulls last, s.idx asc
      limit ${limit}`,
    params
  );

  return {
    total: Number(totalRes.rows[0]?.n ?? 0),
    matches: rows.rows.map((r) => ({
      callId: r.call_id,
      segmentIdx: r.idx,
      role: r.role,
      startMs: r.start_ms,
      snippet: r.snippet || r.text,
      text: r.text,
      startedAt: r.started_at ? r.started_at.toISOString() : null,
      managerName: r.manager_name,
      clientTitle: r.company_title || r.contact_name || r.client_title,
      phone: r.phone_number,
      dealUrl: r.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
      leadUrl: r.bitrix_lead_id && origin ? `${origin}/crm/lead/details/${r.bitrix_lead_id}/` : null,
    })),
  };
}
