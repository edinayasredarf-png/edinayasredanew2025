import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getMeeting, getMeetingSegments, updateMeeting } from "@/lib/server/aiSales/meetingsDb";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(request: NextRequest) {
  try { await requireRopAccess(request); return null; } catch (e) {
    return NextResponse.json({ error: "Нет доступа" }, { status: (e as { status?: number }).status ?? 401 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard(request); if (denied) return denied;
  const { id } = await params;
  const m = await getMeeting(id);
  if (!m) return NextResponse.json({ error: "Встреча не найдена" }, { status: 404 });
  const { downloadUrl: _omit, ...meeting } = m; void _omit; // временную ссылку на запись наружу не отдаём
  return NextResponse.json({ meeting, segments: await getMeetingSegments(id) });
}

/** PATCH { typeId } — сменить тип встречи (ручной выбор) и пересчитать анализ. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard(request); if (denied) return denied;
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { typeId?: string | null };
  await updateMeeting(id, { typeId: body.typeId || null, typeSource: body.typeId ? "manual" : "auto", analysis: null, summary: null });
  await enqueueJob({ type: "meeting.analyze", payload: { meetingId: id }, priority: 85, maxAttempts: 3, idempotencyKey: `meeting:analyze:${id}:${Date.now()}` });
  return NextResponse.json({ ok: true });
}

/** POST { action: 'reanalyze' | 'retry' } — пересчитать анализ или перезапустить обработку с начала. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard(request); if (denied) return denied;
  const { id } = await params;
  const { action } = (await request.json().catch(() => ({}))) as { action?: string };
  if (action === "reanalyze") {
    await updateMeeting(id, { analysis: null, error: null });
    await enqueueJob({ type: "meeting.analyze", payload: { meetingId: id }, priority: 85, maxAttempts: 3, idempotencyKey: `meeting:analyze:${id}:${Date.now()}` });
    return NextResponse.json({ ok: true });
  }
  if (action === "retry") {
    await updateMeeting(id, { status: "NEW", conversionId: null, error: null });
    await enqueueJob({ type: "meeting.process", payload: { meetingId: id }, priority: 85, maxAttempts: 3, idempotencyKey: `meeting:process:${id}:${Date.now()}` });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
