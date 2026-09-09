import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { updateDocument, deleteDocument, reindexDocument } from "@/lib/server/aiSales/kbDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Обновить документ (при изменении текста — переиндексация). РОП/админ. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string; category?: string | null; content?: string; isActive?: boolean; reindex?: boolean;
    };
    if (body.reindex) {
      const res = await reindexDocument(id);
      return NextResponse.json({ ok: true, ...res });
    }
    await updateDocument(id, { title: body.title, category: body.category, content: body.content, isActive: body.isActive });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка обновления документа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Удалить документ. РОП/админ. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 403;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const { id } = await params;
  try {
    await deleteDocument(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка удаления документа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
