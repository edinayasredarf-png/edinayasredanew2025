import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { setSetting } from "@/lib/server/aiSales/settingsDb";
import { getFinancePlans } from "@/lib/server/financeDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Сохранение планов и затрат. PUT { incomePlanMonthly?, expensesMonthly?, salesPlanMonthly?, linePlanDefaultMin?, linePlanByManager? } — 0/пусто = сбросить. */
export async function PUT(request: NextRequest) {
  let userId: string | null = null;
  try {
    const u = await requireRopAccess(request);
    userId = u.id ?? null;
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const scalar = ["incomePlanMonthly", "expensesMonthly", "salesPlanMonthly", "linePlanDefaultMin"] as const;
  for (const k of scalar) {
    if (!(k in body)) continue;
    const raw = body[k];
    const n = raw === "" || raw == null ? 0 : Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 1e12) return NextResponse.json({ error: `Некорректное значение: ${k}` }, { status: 400 });
    await setSetting(`finance.${k}`, n > 0 ? n : null, userId);
  }
  if ("linePlanByManager" in body) {
    const src = (body.linePlanByManager ?? {}) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [id, v] of Object.entries(src)) {
      const n = Number(v);
      if (/^\d+$/.test(id) && Number.isFinite(n) && n > 0 && n <= 1440) out[id] = Math.round(n);
    }
    await setSetting("finance.linePlanByManager", out, userId);
  }
  return NextResponse.json({ ok: true, plans: await getFinancePlans() });
}
