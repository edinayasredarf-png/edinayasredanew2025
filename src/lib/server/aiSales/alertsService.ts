import "server-only";

/**
 * «Сигналы РОПа» — единая проактивная лента «что горит прямо сейчас». Не новый
 * анализ, а агрегатор поверх готовых движков (§45: правила/агрегация кодом, не
 * LLM): сделочные рекомендации, просроченные обещания клиентам, систематически
 * слабый этап у менеджеров, всплеск причины проигрышей. Каждый сигнал —
 * действие, а не просто цифра: severity + что сделать + ссылка на сущность.
 */
import { getDailyRecommendations } from "@/lib/server/aiSales/recommendationsDb";
import { getOverdueFollowUps } from "@/lib/server/aiSales/followupsDb";
import { getInsights, CRITERION_LABEL } from "@/lib/server/aiSales/insightsDb";
import { getLostDealAnalytics } from "@/lib/server/aiSales/lostDealsDb";

export type Severity = "critical" | "risk" | "opportunity";
export type SignalKind = "deal" | "commitment" | "coaching" | "lost";

export interface Signal {
  id: string;
  severity: Severity;
  kind: SignalKind;
  title: string;          // коротко, что произошло
  detail: string;         // почему это сигнал
  action: string | null;  // что сделать
  link: string | null;    // ссылка на сделку в Bitrix (если применимо)
  manager: string | null;
  count: number | null;   // для агрегированных сигналов
}

interface DateRange { from?: string | null; to?: string | null }

const SEV_ORDER: Record<Severity, number> = { critical: 0, risk: 1, opportunity: 2 };

// Пороги (подобраны консервативно, чтобы не шуметь).
const WEAK_CRITERION_MAX = 6;   // средний балл этапа < 6/10 → системный провал
const WEAK_CRITERION_MIN_CALLS = 8; // и накоплено достаточно звонков (в insights уже отфильтровано по latest)
const LOST_SPIKE_MIN = 3;       // минимум проигрышей по одной причине
const LOST_SPIKE_SHARE = 0.4;   // и её доля среди проигрышей

export interface SignalsResult {
  signals: Signal[];
  counts: { critical: number; risk: number; opportunity: number };
  digest: string; // короткий текст «на утро» для РОПа
}

export async function getSignals(
  managerBitrixId: string | null,
  range?: DateRange
): Promise<SignalsResult> {
  const [reco, overdue, insights, lost] = await Promise.all([
    getDailyRecommendations(managerBitrixId, range),
    getOverdueFollowUps(managerBitrixId),
    getInsights(managerBitrixId, range),
    getLostDealAnalytics(managerBitrixId, range),
  ]);

  const signals: Signal[] = [];

  // 1) Критичные сделки (горячие без шага, риск на горячей/тёплой).
  for (const r of reco.critical.slice(0, 12)) {
    signals.push({
      id: `deal-crit-${r.bitrixDealId}`,
      severity: "critical",
      kind: "deal",
      title: r.company || r.title || `Сделка #${r.bitrixDealId}`,
      detail: r.reason,
      action: r.action,
      link: r.dealUrl,
      manager: r.manager,
      count: null,
    });
  }

  // 2) Просроченные обещания клиентам (агрегат + топ-3 самых старых).
  if (overdue.length) {
    const top = overdue.slice(0, 3).map((o) => o.action).filter(Boolean);
    signals.push({
      id: "commitments-overdue",
      severity: "critical",
      kind: "commitment",
      title: `Просрочены обещания клиентам: ${overdue.length}`,
      detail: top.length ? `Например: ${top.join("; ")}` : "Обещанные менеджерами действия не выполнены в срок.",
      action: "Закрыть просроченные follow-up или перенести срок клиенту.",
      link: null,
      manager: null,
      count: overdue.length,
    });
  }

  // 3) Систематически слабый этап у менеджеров.
  const weak = insights.managerWeakCriteria.find((w) => w.avg > 0 && w.avg < WEAK_CRITERION_MAX);
  if (weak && insights.totalAnalyzed >= WEAK_CRITERION_MIN_CALLS) {
    signals.push({
      id: `coaching-${weak.key}`,
      severity: "risk",
      kind: "coaching",
      title: `Слабый этап у отдела: ${CRITERION_LABEL[weak.key] || weak.key}`,
      detail: `Средний балл по этапу — ${weak.avg}/10 на ${insights.totalAnalyzed} разобранных звонках.`,
      action: "Провести короткий разбор этого этапа на планёрке (примеры — в «Контроле качества»).",
      link: null,
      manager: null,
      count: null,
    });
  }

  // 4) Всплеск одной причины проигрышей.
  const topLost = lost.reasons[0];
  if (topLost && topLost.count >= LOST_SPIKE_MIN && lost.total > 0 && topLost.count / lost.total >= LOST_SPIKE_SHARE) {
    const pct = Math.round((topLost.count / lost.total) * 100);
    signals.push({
      id: `lost-${topLost.reason}`,
      severity: "risk",
      kind: "lost",
      title: `Частая причина проигрышей: ${topLost.label}`,
      detail: `${topLost.count} из ${lost.total} проигрышей (${pct}%) — по этой причине.`,
      action: "Разобрать причину: скрипт, продукт или цена. Детали — во вкладке «Проигрыши».",
      link: null,
      manager: null,
      count: topLost.count,
    });
  }

  // 5) Сделки-риски (зависшие, тёплые без шага) — добавляем после критичных.
  for (const r of reco.risk.slice(0, 8)) {
    signals.push({
      id: `deal-risk-${r.bitrixDealId}`,
      severity: "risk",
      kind: "deal",
      title: r.company || r.title || `Сделка #${r.bitrixDealId}`,
      detail: r.reason,
      action: r.action,
      link: r.dealUrl,
      manager: r.manager,
      count: null,
    });
  }

  signals.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const counts = {
    critical: signals.filter((s) => s.severity === "critical").length,
    risk: signals.filter((s) => s.severity === "risk").length,
    opportunity: reco.counts.opportunity,
  };

  return { signals, counts, digest: buildDigest(signals, counts, insights.headlines) };
}

/** Короткая сводка «на утро»: сначала критичное, потом 1-2 системных вывода. */
function buildDigest(signals: Signal[], counts: SignalsResult["counts"], headlines: string[]): string {
  const lines: string[] = [];
  if (counts.critical > 0) lines.push(`🔴 Критично — ${counts.critical}:`);
  for (const s of signals.filter((x) => x.severity === "critical").slice(0, 5)) {
    lines.push(`• ${s.title} — ${s.detail}`);
  }
  const risks = signals.filter((x) => x.severity === "risk");
  if (risks.length) {
    lines.push(`🟡 Требует внимания — ${risks.length}:`);
    for (const s of risks.slice(0, 4)) lines.push(`• ${s.title} — ${s.detail}`);
  }
  if (headlines[0]) {
    lines.push("", "Вывод по отделу:");
    for (const h of headlines.slice(0, 2)) lines.push(`• ${h}`);
  }
  if (!lines.length) return "Критичных сигналов нет — можно работать в штатном режиме.";
  return lines.join("\n");
}
