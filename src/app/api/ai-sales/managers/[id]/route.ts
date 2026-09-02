import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getManagerDetail } from "@/lib/server/aiSales/managersDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const { id } = await params;
  const sp = request.nextUrl.searchParams;
  try {
    const data = await getManagerDetail(id, { from: sp.get("from"), to: sp.get("to") });
    if (!data) return NextResponse.json({ error: "Менеджер не найден" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка карточки менеджера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
