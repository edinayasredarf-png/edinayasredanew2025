import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, requireSalesAccess } from "@/lib/server/authFromBearer";
import { purgeFailedJobs, queueDetails } from "@/lib/server/aiSales/jobsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Детальная очередь обработки: что выполняется сейчас, что в очереди и ошибки. */
export async function GET(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const data = await queueDetails();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка очереди";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Очистка старых ошибок очереди: DELETE ?olderThanDays=N (0 — все ошибочные). Только админ. */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только администратору" }, { status });
  }
  const raw = request.nextUrl.searchParams.get("olderThanDays");
  const days = Number(raw);
  if (raw == null || !Number.isFinite(days) || days < 0 || days > 3650) {
    return NextResponse.json({ error: "Укажите olderThanDays (0–3650)" }, { status: 400 });
  }
  try {
    const deleted = await purgeFailedJobs(days);
    return NextResponse.json({ ok: true, deleted });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ошибка очистки" }, { status: 500 });
  }
}
