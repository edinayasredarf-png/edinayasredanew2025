import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetSourceItem, dbSetSourceItemStatus, dbUpsertTopic } from "@/lib/server/contentOsDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Превращает элемент ленты в тему (§19 ТЗ: source item → topic) и отмечает его использованным. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 401 });
  }

  const { id } = await params;
  const item = await dbGetSourceItem(id);
  if (!item) return NextResponse.json({ error: "Элемент ленты не найден" }, { status: 404 });

  const topicId = await dbUpsertTopic({
    title: item.title,
    source_item_id: item.id,
    thesis: item.snippet,
    status: "new",
  });
  await dbSetSourceItemStatus(id, "used");

  return NextResponse.json({ id: topicId });
}
