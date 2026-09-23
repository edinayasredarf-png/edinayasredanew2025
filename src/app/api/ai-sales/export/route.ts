import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { listManagers } from "@/lib/server/aiSales/managersDb";
import { getInsights, CRITERION_LABEL } from "@/lib/server/aiSales/insightsDb";
import { buildXlsx, type Cell, type Sheet } from "@/lib/server/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESULT_LABEL: Record<string, string> = {
  agreed: "договорились", not_agreed: "не договорились", callback: "перезвон",
  meeting_set: "назначена встреча", send_quote: "отправить КП",
  not_interested: "не заинтересован", other: "прочее",
};

/** Отчёт РОПа за период → .xlsx (лист по менеджерам + сводка отдела). */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }

  const sp = request.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const range = { from, to };

  try {
    const [managers, insights] = await Promise.all([listManagers(range), getInsights(null, range)]);

    // Лист 1 — менеджеры.
    const mgrRows: Cell[][] = [
      ["Менеджер", "Звонки", "Проанализировано", "Сделки", "Горячие", "Ср. оценка (0–10)", "Ср. Deal Score (0–100)"],
      ...managers.map((m) => [
        m.name || `ID ${m.bitrixUserId}`, m.calls, m.analyzed, m.deals, m.hotDeals,
        m.avgManagerScore ?? "", m.avgDealScore ?? "",
      ]),
    ];

    // Лист 2 — сводка отдела.
    const sum: Cell[][] = [];
    const period = from || to ? `${from || "…"} — ${to || "…"}` : "весь период";
    sum.push(["Сводка отдела продаж", ""]);
    sum.push(["Период", period]);
    sum.push(["Разобрано звонков", insights.totalAnalyzed]);
    sum.push(["", ""]);
    sum.push(["Ключевые выводы", ""]);
    for (const h of insights.headlines) sum.push([h, ""]);
    sum.push(["", ""]);
    sum.push(["Слабые этапы (ср. балл /10)", ""]);
    for (const w of insights.managerWeakCriteria) sum.push([CRITERION_LABEL[w.key] || w.key, w.avg]);
    sum.push(["", ""]);
    sum.push(["Топ возражений", "Всего / не отработано"]);
    for (const o of insights.topObjections) sum.push([o.text, `${o.count} / ${o.unhandled}`]);
    sum.push(["", ""]);
    sum.push(["Топ продуктов", "Упоминаний"]);
    for (const p of insights.topProducts) sum.push([p.name, p.count]);
    sum.push(["", ""]);
    sum.push(["Результаты звонков", "Количество"]);
    for (const r of insights.resultDistribution) sum.push([RESULT_LABEL[r.type] || r.type, r.count]);

    const sheets: Sheet[] = [
      { name: "Менеджеры", rows: mgrRows, headerRows: 1 },
      { name: "Сводка отдела", rows: sum, headerRows: 1 },
    ];

    const buf = await buildXlsx(sheets);
    const stamp = (to || from || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, "");
    const filename = `Отчет-продажи-${stamp}.xlsx`;
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка экспорта";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
