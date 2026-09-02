import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";
import type { CallAnalysis } from "@/lib/ai/schemas/callAnalysis";

/**
 * Follow-up engine (§35 ТЗ): обещания менеджера («отправлю КП завтра») → записи
 * ai_followups. По дедлайну — просрочка (OVERDUE вычисляем на чтении). РОП видит
 * список и отмечает выполнение; просроченные попадают в «AI рекомендует».
 */

/** Создать follow-ups из обещаний менеджера. Идемпотентно по (call_id, action). */
export async function createFollowUpsFromAnalysis(
  callId: string,
  data: CallAnalysis,
  call: { bitrix_deal_id: string | null; bitrix_user_id: string | null }
): Promise<number> {
  const pool = getTimewebPool();
  const commitments = (data.commitments || []).filter(
    (c) => c.by === "MANAGER" && c.action?.trim()
  );
  let n = 0;
  for (const c of commitments) {
    const deadline = c.deadlineDate && /^\d{4}-\d{2}-\d{2}$/.test(c.deadlineDate) ? c.deadlineDate : null;
    // Идемпотентность: не плодим одинаковые обещания по одному звонку.
    const exists = await pool.query(
      `select 1 from ai_followups where call_id = $1 and lower(trim(action)) = lower(trim($2)) limit 1`,
      [callId, c.action]
    );
    if (exists.rowCount) continue;
    await pool.query(
      `insert into ai_followups (call_id, bitrix_deal_id, bitrix_user_id, action, deadline, status)
       values ($1,$2,$3,$4,$5,'OPEN')`,
      [callId, call.bitrix_deal_id, call.bitrix_user_id, c.action.trim(), deadline]
    );
    n++;
  }
  return n;
}

export interface FollowUpItem {
  id: string;
  action: string;
  deadline: string | null;
  status: string; // OPEN | OVERDUE (derived) | DONE | CANCELLED
  overdue: boolean;
  bitrixDealId: string | null;
  dealUrl: string | null;
  company: string | null;
  manager: string | null;
  callId: string | null;
  createdAt: string | null;
}

export async function listFollowUps(f: {
  managerBitrixId?: string | null;
  status?: string | null; // open | done | overdue
}): Promise<{ items: FollowUpItem[]; openCount: number; overdueCount: number }> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();
  const where: string[] = ["true"];
  const params: unknown[] = [];
  let i = 1;
  if (f.managerBitrixId) { where.push(`fu.bitrix_user_id = $${i++}`); params.push(f.managerBitrixId); }
  if (f.status === "done") where.push(`fu.status = 'DONE'`);
  else if (f.status === "open") where.push(`fu.status = 'OPEN'`);
  else where.push(`fu.status in ('OPEN','OVERDUE')`); // по умолчанию — активные

  const rows = await pool.query<{
    id: string; action: string; deadline: Date | null; status: string;
    bitrix_deal_id: string | null; company: string | null; manager: string | null;
    call_id: string | null; created_at: Date;
  }>(
    `select fu.id, fu.action, fu.deadline, fu.status, fu.bitrix_deal_id,
            co.title as company, m.full_name as manager, fu.call_id, fu.created_at
       from ai_followups fu
       left join ai_deals d on d.bitrix_deal_id = fu.bitrix_deal_id
       left join ai_companies co on co.bitrix_company_id = d.bitrix_company_id
       left join ai_managers m on m.bitrix_user_id = fu.bitrix_user_id
      where ${where.join(" and ")}
      order by fu.deadline asc nulls last, fu.created_at desc
      limit 300`,
    params
  );

  const now = Date.now();
  let openCount = 0, overdueCount = 0;
  const items: FollowUpItem[] = rows.rows.map((r) => {
    const isActive = r.status === "OPEN" || r.status === "OVERDUE";
    const overdue = isActive && !!r.deadline && r.deadline.getTime() < now;
    if (isActive) openCount++;
    if (overdue) overdueCount++;
    return {
      id: r.id,
      action: r.action,
      deadline: r.deadline ? r.deadline.toISOString() : null,
      status: overdue ? "OVERDUE" : r.status,
      overdue,
      bitrixDealId: r.bitrix_deal_id,
      dealUrl: r.bitrix_deal_id && origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
      company: r.company,
      manager: r.manager,
      callId: r.call_id,
      createdAt: r.created_at ? r.created_at.toISOString() : null,
    };
  });

  // Отфильтровать по overdue, если запрошено.
  const filtered = f.status === "overdue" ? items.filter((x) => x.overdue) : items;
  return { items: filtered, openCount, overdueCount };
}

export async function completeFollowUp(id: string): Promise<boolean> {
  const pool = getTimewebPool();
  const { rowCount } = await pool.query(
    `update ai_followups set status='DONE', completed_at=now(), updated_at=now()
      where id = $1 and status in ('OPEN','OVERDUE')`,
    [id]
  );
  return (rowCount ?? 0) > 0;
}

/** Просроченные обещания менеджеров — для «AI рекомендует» (критично). */
export async function getOverdueFollowUps(
  managerBitrixId: string | null
): Promise<Array<{ bitrixDealId: string | null; action: string; manager: string | null; deadline: string | null }>> {
  const pool = getTimewebPool();
  const params: unknown[] = [];
  let mgr = "";
  if (managerBitrixId) { params.push(managerBitrixId); mgr = ` and fu.bitrix_user_id = $${params.length}`; }
  const { rows } = await pool.query<{
    bitrix_deal_id: string | null; action: string; manager: string | null; deadline: Date | null;
  }>(
    `select fu.bitrix_deal_id, fu.action, m.full_name as manager, fu.deadline
       from ai_followups fu
       left join ai_managers m on m.bitrix_user_id = fu.bitrix_user_id
      where fu.status in ('OPEN','OVERDUE') and fu.deadline is not null
        and fu.deadline < now()${mgr}
      order by fu.deadline asc limit 100`,
    params
  );
  return rows.map((r) => ({
    bitrixDealId: r.bitrix_deal_id,
    action: r.action,
    manager: r.manager,
    deadline: r.deadline ? r.deadline.toISOString() : null,
  }));
}
