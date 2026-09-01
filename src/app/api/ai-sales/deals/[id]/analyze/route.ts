import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Пересчитать агрегированный разбор сделки. ?force=1 — игнорировать кэш. */
export async function POST(
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
  const force = request.nextUrl.searchParams.get("force") === "1";
  const jobId = await enqueueJob({ type: "deal.analyze", payload: { dealId: id, force }, priority: 40 });
  return NextResponse.json({ ok: true, jobId });
}
