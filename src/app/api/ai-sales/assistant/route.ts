import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess } from "@/lib/server/authFromBearer";
import { askAssistant } from "@/lib/server/aiSales/assistantService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** RAG-ассистент: ответ по базе знаний (+ опционально по конкретному звонку). */
export async function POST(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { question?: string; callId?: string | null };
    if (!body.question || !body.question.trim()) {
      return NextResponse.json({ error: "Пустой вопрос" }, { status: 400 });
    }
    const res = await askAssistant(body.question, body.callId ?? null);
    return NextResponse.json(res);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка ассистента";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
