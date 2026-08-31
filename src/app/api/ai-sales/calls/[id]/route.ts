import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getCallDetail } from "@/lib/server/aiSales/readDb";

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
    const data = await getCallDetail(id);
    if (!data) return NextResponse.json({ error: "Звонок не найден" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка карточки звонка";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
