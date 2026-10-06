import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess, requireSalesAccess } from "@/lib/server/authFromBearer";
import { listBriefs } from "@/lib/server/aiSales/briefsDb";
import { managerFilterFor } from "@/lib/server/aiSales/rbacFilter";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  try {
    const data = await listBriefs({
      managerBitrixId: managerFilterFor(user),
      entityType: sp.get("type"),
      onlyNew: sp.get("onlyNew") === "1",
      q: sp.get("q"),
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
      offset: sp.get("offset") ? Number(sp.get("offset")) : undefined,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка списка брифов" }, { status: 500 });
  }
}

/** Ручной запуск брифа: { entityType: 'lead'|'deal', id } или ссылка на карточку Bitrix. */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const body = (await request.json().catch(() => ({}))) as { entityType?: string; id?: string; url?: string };
  let type = body.entityType;
  let id = String(body.id ?? "").trim();
  if (body.url) {
    const m = String(body.url).match(/crm\/(lead|deal)\/details\/(\d+)/);
    if (m) { type = m[1]; id = m[2]; }
  }
  if ((type !== "lead" && type !== "deal") || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Укажите тип (лид/сделка) и числовой ID либо ссылку на карточку Bitrix" }, { status: 400 });
  }
  const jobId = await enqueueJob({
    type: type === "lead" ? "brief.lead" : "brief.deal",
    payload: type === "lead" ? { leadId: id } : { dealId: id },
    priority: 10, maxAttempts: 2, idempotencyKey: `brief:manual:${type}:${id}:${Date.now()}`,
  });
  return NextResponse.json({ ok: true, jobId });
}
