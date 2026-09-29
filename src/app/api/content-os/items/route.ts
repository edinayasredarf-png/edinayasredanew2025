import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbAddItemVersion, dbDeleteItem, dbGetItem, dbUpsertItem } from "@/lib/server/contentOsDb";
import { getUserFromRequest } from "@/lib/server/authFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
    ? (e as { status: number }).status : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

// Создание/обновление контент-айтема. Утверждение публикации (status →
// 'approved') — та же граница: requireAdminAccess уже проверяет права,
// отдельного requireContentOsApproval не заводим, пока в проекте одна
// админ-роль на запись контента (см. security.md §1 — расширить, когда
// появится роль content_editor без права утверждать).
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = await request.json();
    if (!body?.cluster_id || !body?.channel) {
      return NextResponse.json({ error: "cluster_id and channel required" }, { status: 400 });
    }
    const existing = body.id ? await dbGetItem(body.id) : null;
    const id = await dbUpsertItem(body);
    // Версионируем только реальное изменение текста, не первое создание (это уже тело).
    if (existing && body.body != null && body.body !== existing.body) {
      const user = await getUserFromRequest(request).catch(() => null);
      await dbAddItemVersion({ content_item_id: id, body: body.body, edited_by: user?.email ?? "editor", note: body.versionNote ?? "" });
    }
    return NextResponse.json({ id });
  } catch (e) {
    return jsonErr(e, 401);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbDeleteItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonErr(e, 401);
  }
}
