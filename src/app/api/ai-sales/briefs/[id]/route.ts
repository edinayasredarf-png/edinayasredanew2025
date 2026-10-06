import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getBrief, markBriefSeen } from "@/lib/server/aiSales/briefsDb";
import { managerFilterFor } from "@/lib/server/aiSales/rbacFilter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const { id } = await params;
  try {
    const data = await getBrief(id, false);
    if (!data) return NextResponse.json({ error: "Бриф не найден" }, { status: 404 });
    const mf = managerFilterFor(user);
    if (mf && data.brief.bitrixUserId !== mf) return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    await markBriefSeen(id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка брифа" }, { status: 500 });
  }
}
