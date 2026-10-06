import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getLatestBrief } from "@/lib/server/aiSales/briefsDb";
import { managerFilterFor } from "@/lib/server/aiSales/rbacFilter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Последний бриф по лиду/сделке: ?type=lead|deal&id=123 (карточка звонка). */
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type");
  const id = sp.get("id") ?? "";
  if ((type !== "lead" && type !== "deal") || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Нужны type=lead|deal и числовой id" }, { status: 400 });
  }
  try {
    const brief = await getLatestBrief(type, id);
    const mf = managerFilterFor(user);
    if (brief && mf && brief.bitrixUserId !== mf) return NextResponse.json({ brief: null });
    return NextResponse.json({ brief });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка брифа" }, { status: 500 });
  }
}
