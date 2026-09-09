import { NextRequest, NextResponse } from "next/server";
import { requireSalesAccess, requireRopAccess } from "@/lib/server/authFromBearer";
import { listDocuments, createDocument, KB_CATEGORIES } from "@/lib/server/aiSales/kbDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Документы базы знаний + справочник категорий. */
export async function GET(request: NextRequest) {
  try {
    await requireSalesAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const documents = await listDocuments();
    return NextResponse.json({ documents, categories: KB_CATEGORIES });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка базы знаний";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Создать документ (индексируется сразу). РОП/админ. */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  try {
    const body = (await request.json().catch(() => ({}))) as { title?: string; category?: string | null; content?: string };
    const id = await createDocument({ title: body.title || "", category: body.category ?? null, content: body.content || "" });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка создания документа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
