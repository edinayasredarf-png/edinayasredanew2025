import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";
import { setCallStatus } from "@/lib/server/aiSales/callsDb";
import { getTimewebPool } from "@/lib/timewebPg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Перетранскрибировать звонок заново (текущим провайдером из настроек) и прогнать
 * всю цепочку: транскрибация → диаризация/роли → анализ. Чистим прошлые задачи
 * цепочки, чтобы шаги не заблокировались идемпотентными ключами, и ставим заново.
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
  const pool = getTimewebPool();
  await pool.query(
    `delete from ai_jobs
       where (payload->>'callId') = $1
         and type in ('call.transcribe','call.diarize','call.roles','call.analyze')`,
    [id]
  );
  await setCallStatus(id, "PENDING");

  const jobId = await enqueueJob({
    type: "call.transcribe",
    payload: { callId: id },
    idempotencyKey: `transcribe:${id}`,
    priority: 50,
  });

  return NextResponse.json({ ok: true, jobId });
}
