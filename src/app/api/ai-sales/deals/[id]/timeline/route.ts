import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { getDealTimeline } from "@/lib/server/aiSales/dealTimelineService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Живой таймлайн сделки из Bitrix (комментарии + активности). */
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
    const data = await getDealTimeline(id);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка таймлайна";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
