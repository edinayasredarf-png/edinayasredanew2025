import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Поставить (пере)анализ звонка в очередь. ?force=1 — игнорировать кэш.
 * Тяжёлую работу не делаем в запросе — только enqueue.
 */
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

  const jobId = await enqueueJob({
    type: "call.analyze",
    payload: { callId: id, force },
    // Разрешаем повторную постановку при force (новый ключ).
    idempotencyKey: force ? `analyze:${id}:${Date.now()}` : `analyze:${id}`,
    priority: 40,
  });

  return NextResponse.json({ ok: true, jobId });
}
