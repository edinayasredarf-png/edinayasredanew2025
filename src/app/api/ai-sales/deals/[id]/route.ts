import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getDealDetail } from "@/lib/server/aiSales/dealsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const { id } = await params;
  try {
    const data = await getDealDetail(id);
    if (!data) return NextResponse.json({ error: "Сделка не найдена" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка карточки сделки";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
