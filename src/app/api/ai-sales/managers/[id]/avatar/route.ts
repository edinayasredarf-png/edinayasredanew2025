import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { dbInsertEditorMedia } from "@/lib/server/dataDb";
import { setManagerAvatar } from "@/lib/server/aiSales/managersDb";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;

/** Загрузка фото менеджера (настройки → «Отделы»/карточка менеджера). Доступ — РОП/админ. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const { id } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Разрешены только изображения" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Файл слишком большой (макс. 4 МБ)" }, { status: 413 });
    }

    const mediaId = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    await dbInsertEditorMedia(mediaId, file.type, buffer);

    const avatarUrl = `/api/media/${mediaId}`;
    await setManagerAvatar(id, avatarUrl);
    return NextResponse.json({ avatarUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка загрузки фото";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Удаление фото (возврат к иконке-заглушке). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const { id } = await params;
  try {
    await setManagerAvatar(id, null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка удаления фото";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
