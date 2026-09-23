import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getScriptStepMatrix } from "@/lib/server/aiSales/reportsDb";
import { buildXlsx, type Cell } from "@/lib/server/xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Экспорт матрицы «менеджер × шаги скрипта» в .xlsx. */
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
  try {
    const m = await getScriptStepMatrix({ from, to });
    const header: Cell[] = ["Менеджер", "Звонков", "Ср. балл (%)", ...m.steps.map((s) => s.title)];
    const rows: Cell[][] = [
      header,
      ...m.managers.map((mgr) => [
        mgr.name || `ID ${mgr.bitrixUserId}`, mgr.calls, mgr.avgScore ?? "",
        ...m.steps.map((s) => { const c = mgr.cells[s.key]; return c && c.pct != null ? c.pct : ""; }),
      ]),
    ];
    const buf = await buildXlsx([{ name: "Соблюдение по шагам", rows, headerRows: 1 }]);
    const stamp = (to || from || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, "");
    const filename = `Чек-листы-по-шагам-${stamp}.xlsx`;
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
