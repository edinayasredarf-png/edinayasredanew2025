export const DEAL_INSIGHT_PROMPT_VERSION = "deal-insight-v1";

export const DEAL_INSIGHT_SYSTEM = `Ты — руководитель отдела продаж компании «Единая среда» (цифровизация территорий: инвентаризация зелёных насаждений, кладбищ, ЖКХ, лесоустройство, цифровые двойники).

Тебе дан хронологический список РАЗБОРОВ ЗВОНКОВ по ОДНОЙ сделке (каждый звонок — тип, дата, краткое содержание, сигналы). Твоя задача — дать ХОЛИСТИЧЕСКУЮ оценку сделки целиком, а не по отдельному звонку.

ПРАВИЛА:
1. Оценивай сделку по СОВОКУПНОСТИ сигналов всей истории, а не по последнему/случайному звонку. Температура и score отражают текущее состояние сделки с учётом динамики.
2. Оценка менеджера (managerAssessment.overall, 0-10) — по ПОКАЗАТЕЛЬНЫМ звонкам сделки (первичный контакт, выявление потребности, презентация, переговоры, закрытие). НЕ занижай из-за коротких уточняющих звонков — быстрый звонок «продублировать письмо» не должен портить оценку, если в основных звонках менеджер отработал хорошо. Если показательных звонков не было — overall=null.
3. keyFacts — агрегируй по всей истории (бюджет, сроки, ЛПР, продукты, текущее решение клиента). Если чего-то не было ни в одном звонке — null.
4. nextBestAction — конкретное следующее действие менеджера по сделке (позвонить и уточнить бюджет, отправить КП, назначить демо, выяснить ЛПР и т.п.).
5. risks — реальные риски потери сделки (нет бюджета, нет следующего шага, конкурент, зависла и т.п.).
6. Ничего не выдумывай — опирайся только на разборы звонков. Отвечай на русском.
7. Верни СТРОГО валидный JSON по схеме, без пояснений.`;

export interface DealCallDigestItem {
  date: string | null;
  callType: string;
  connected: boolean;
  managerScoreApplicable: boolean;
  managerScore: number | null;
  dealScore: number | null;
  temperature: string | null;
  summary: string;
}

export function buildDealInsightUser(
  digest: DealCallDigestItem[],
  ctx?: { companyTitle?: string | null; dealTitle?: string | null }
): string {
  const head: string[] = [];
  if (ctx?.companyTitle) head.push(`Компания: ${ctx.companyTitle}`);
  if (ctx?.dealTitle) head.push(`Сделка: ${ctx.dealTitle}`);
  head.push(`Всего звонков: ${digest.length}`);

  const lines = digest.map((c, i) => {
    const parts = [
      `#${i + 1}`,
      c.date ? new Date(c.date).toLocaleString("ru-RU") : "без даты",
      `тип: ${c.callType}`,
      c.connected ? "состоялся" : "НЕ состоялся",
      c.managerScoreApplicable ? "показательный" : "краткий",
      c.managerScore != null ? `оценка менеджера: ${c.managerScore}/10` : "оценка менеджера: —",
      c.temperature ? `темп.: ${c.temperature}` : "",
    ].filter(Boolean);
    return `${parts.join(" | ")}\n  ${c.summary}`;
  });

  return `${head.join("\n")}\n\nРАЗБОРЫ ЗВОНКОВ (хронологически):\n${lines.join("\n\n")}`;
}
