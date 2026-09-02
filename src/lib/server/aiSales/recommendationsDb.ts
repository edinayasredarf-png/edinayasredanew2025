import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { bitrixPortalOrigin } from "@/lib/server/bitrix/client";

/**
 * «AI рекомендует» — кому звонить сегодня (§10 ТЗ). Правило-ориентированный движок
 * (§45: агрегация/классификация кодом, не LLM) поверх готовых разборов сделок.
 * Три корзины по срочности: critical (вмешаться), risk (риск потери), opportunity
 * (сигналы покупки). Каждая сделка попадает в САМУЮ срочную подходящую корзину.
 */

export type Severity = "critical" | "risk" | "opportunity";

export interface RecoItem {
  bitrixDealId: string;
  title: string | null;
  company: string | null;
  manager: string | null;
  dealUrl: string | null;
  severity: Severity;
  reason: string;         // почему в списке
  action: string | null;  // рекомендованное действие
  temperature: string | null;
  dealScore: number | null;
  daysSinceCall: number | null;
  lastCallAt: string | null;
}

export interface DailyRecommendations {
  critical: RecoItem[];
  risk: RecoItem[];
  opportunity: RecoItem[];
  counts: { critical: number; risk: number; opportunity: number };
}

const STALLED_DAYS = 10; // сколько дней без звонка считаем «зависла»

interface Row {
  bitrix_deal_id: string;
  title: string | null;
  company: string | null;
  manager: string | null;
  deal_score: number | null;
  deal_temperature: string | null;
  next_action: string | null;
  last_call_at: Date | null;
  risks: Array<{ type?: string; detail?: string }> | null;
  facts: { budget?: string | null; timeline?: string | null; decisionMaker?: string | null } | null;
  stage_rec: string | null;
}

export async function getDailyRecommendations(
  managerBitrixId: string | null,
  range?: { from?: string | null; to?: string | null }
): Promise<DailyRecommendations> {
  const pool = getTimewebPool();
  const origin = bitrixPortalOrigin();
  const params: unknown[] = [];
  const parts: string[] = ["d.is_closed = false"];
  if (managerBitrixId) { params.push(managerBitrixId); parts.push(`d.bitrix_user_id = $${params.length}`); }
  if (range?.from) { params.push(range.from); parts.push(`di.last_call_at >= $${params.length}::date`); }
  if (range?.to) { params.push(range.to); parts.push(`di.last_call_at < ($${params.length}::date + interval '1 day')`); }

  const { rows } = await pool.query<Row>(
    `select di.bitrix_deal_id, d.title, co.title as company, m.full_name as manager,
            di.deal_score, di.deal_temperature, di.next_action, di.last_call_at,
            di.data->'risks' as risks, di.data->'keyFacts' as facts,
            di.data->>'stageRecommendation' as stage_rec
       from ai_deal_insights di
       join ai_deals d on d.bitrix_deal_id = di.bitrix_deal_id
       left join ai_companies co on co.bitrix_company_id = d.bitrix_company_id
       left join ai_managers m on m.bitrix_user_id = d.bitrix_user_id
      where ${parts.join(" and ")}`,
    params
  );

  const now = Date.now();
  const out: DailyRecommendations = {
    critical: [], risk: [], opportunity: [],
    counts: { critical: 0, risk: 0, opportunity: 0 },
  };

  for (const r of rows) {
    const temp = r.deal_temperature;
    const isHot = temp === "HOT";
    const isWarm = temp === "WARM";
    const noNext = !r.next_action || !r.next_action.trim();
    const risk = Array.isArray(r.risks) ? r.risks.find((x) => x?.detail?.trim()) : null;
    const daysSinceCall = r.last_call_at
      ? Math.floor((now - r.last_call_at.getTime()) / 86400000)
      : null;
    const base = {
      bitrixDealId: r.bitrix_deal_id,
      title: r.title,
      company: r.company,
      manager: r.manager,
      dealUrl: origin ? `${origin}/crm/deal/details/${r.bitrix_deal_id}/` : null,
      temperature: temp,
      dealScore: r.deal_score,
      daysSinceCall,
      lastCallAt: r.last_call_at ? r.last_call_at.toISOString() : null,
      action: r.next_action || r.stage_rec || null,
    };

    let severity: Severity | null = null;
    let reason = "";

    // ── Критично: горячая без следующего шага, или риск на горячей/тёплой ──
    if (isHot && noNext) {
      severity = "critical";
      reason = "Горячая сделка без следующего шага — назначьте действие.";
    } else if (risk && (isHot || isWarm)) {
      severity = "critical";
      reason = `Риск потери: ${risk.detail}`;
    }
    // ── Риск: зависла, или тёплая без шага, или риск на холодной ──
    else if ((isHot || isWarm) && daysSinceCall != null && daysSinceCall > STALLED_DAYS) {
      severity = "risk";
      reason = `Сделка зависла — ${daysSinceCall} дн. без звонка.`;
    } else if (isWarm && noNext) {
      severity = "risk";
      reason = "Тёплая сделка без следующего шага.";
    } else if (risk) {
      severity = "risk";
      reason = `Есть риск: ${risk.detail}`;
    }
    // ── Возможность: горячая в работе, или обозначен бюджет ──
    else if (isHot) {
      severity = "opportunity";
      reason = "Горячая сделка — двигайте к закрытию.";
    } else if (r.facts?.budget) {
      severity = "opportunity";
      reason = `Обозначен бюджет: ${r.facts.budget}`;
    } else if (isWarm) {
      severity = "opportunity";
      reason = "Тёплая сделка — есть интерес, продолжайте.";
    }

    if (!severity) continue;
    out[severity].push({ ...base, severity, reason });
  }

  // Сортировка внутри корзин: горячее и с большим score — выше.
  const rank = (t: string | null) => (t === "HOT" ? 0 : t === "WARM" ? 1 : 2);
  for (const key of ["critical", "risk", "opportunity"] as const) {
    out[key].sort((a, b) => rank(a.temperature) - rank(b.temperature) || (b.dealScore ?? 0) - (a.dealScore ?? 0));
    out.counts[key] = out[key].length;
  }
  return out;
}
