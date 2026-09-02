import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

/**
 * Lost-deal analytics (§29 ТЗ): почему проигрываем сделки. Причина сопоставляется
 * по AI-разбору (риски + сводка), не только по полю Bitrix. Классификация — кодом.
 */

interface DateRange { from?: string | null; to?: string | null }

const REASON_LABEL: Record<string, string> = {
  no_budget: "Нет бюджета", price: "Цена/дорого", competitor: "Конкурент",
  no_project: "Нет проекта/неактуально", no_dm: "Не вышли на ЛПР",
  functional: "Функционал", timeline: "Сроки/отложили", other: "Другое",
};

function classifyLostReason(summary: string, risks: Array<{ detail?: string }>): string {
  const text = (summary + " " + risks.map((r) => r?.detail || "").join(" ")).toLowerCase();
  if (/(нет бюджета|бюджет не|не заложен|нет средств|нет денег|финансировани)/.test(text)) return "no_budget";
  if (/(дорого|цена|стоимост|дешевле|дешёвле)/.test(text)) return "price";
  if (/(конкурент|другая компани|другой подрядчик|сравнива|уже работа)/.test(text)) return "competitor";
  if (/(нет проекта|не планиру|не актуал|передума|не нужн)/.test(text)) return "no_project";
  if (/(лпр|руководител|не принимает|не тот человек|согласовани)/.test(text)) return "no_dm";
  if (/(функци|возможност|не хватает|не умеет|не подходит по)/.test(text)) return "functional";
  if (/(срок|поздно|отложи|следующий год|перенес)/.test(text)) return "timeline";
  return "other";
}

export interface LostDealItem {
  bitrixDealId: string;
  company: string | null;
  manager: string | null;
  dealUrl: string | null;
  reason: string;
  reasonLabel: string;
  summary: string | null;
  closedAt: string | null;
}

export interface LostAnalytics {
  total: number;
  reasons: Array<{ reason: string; label: string; count: number }>;
  deals: LostDealItem[];
}

export async function getLostDealAnalytics(
  managerBitrixId: string | null,
  range?: DateRange
): Promise<LostAnalytics> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();
  const where: string[] = ["d.is_won = false"];
  const params: unknown[] = [];
  let i = 1;
  if (managerBitrixId) { where.push(`d.bitrix_user_id = $${i++}`); params.push(managerBitrixId); }
  if (range?.from) { where.push(`coalesce(di.last_call_at, d.bitrix_updated_at) >= $${i++}::date`); params.push(range.from); }
  if (range?.to) { where.push(`coalesce(di.last_call_at, d.bitrix_updated_at) < ($${i++}::date + interval '1 day')`); params.push(range.to); }

  const { rows } = await pool.query<{
    bitrix_deal_id: string; company: string | null; manager: string | null;
    summary: string | null; risks: Array<{ detail?: string }> | null; closed_at: Date | null;
  }>(
    `select d.bitrix_deal_id, co.title as company, m.full_name as manager,
            di.summary, di.data->'risks' as risks,
            coalesce(di.last_call_at, d.bitrix_updated_at) as closed_at
       from ai_deals d
       left join ai_deal_insights di on di.bitrix_deal_id = d.bitrix_deal_id
       left join ai_companies co on co.bitrix_company_id = d.bitrix_company_id
       left join ai_managers m on m.bitrix_user_id = d.bitrix_user_id
      where ${where.join(" and ")}
      order by closed_at desc nulls last
      limit 500`,
    params
  );

  const reasonCounts = new Map<string, number>();
  const deals: LostDealItem[] = rows.map((r) => {
    const reason = classifyLostReason(r.summary || "", Array.isArray(r.risks) ? r.risks : []);
    reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    return {
      bitrixDealId: r.bitrix_deal_id,
      company: r.company,
      manager: r.manager,
      dealUrl: origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
      reason,
      reasonLabel: REASON_LABEL[reason] || reason,
      summary: r.summary,
      closedAt: r.closed_at ? r.closed_at.toISOString() : null,
    };
  });

  const reasons = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, label: REASON_LABEL[reason] || reason, count }))
    .sort((a, b) => b.count - a.count);

  return { total: deals.length, reasons, deals };
}
