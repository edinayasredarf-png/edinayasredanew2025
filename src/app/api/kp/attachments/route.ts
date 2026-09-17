import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbAddAttachment,
  dbDeleteAttachment,
  dbGetAttachmentData,
  dbListAttachments,
} from "@/lib/server/kp/kpDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_SIZE = 15 * 1024 * 1024;

async function guard(request: NextRequest): Promise<NextResponse | null> {
  try {
    await requireAdminAccess(request);
    return null;
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
}

function cd(filename: string): string {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (id) {
    const f = await dbGetAttachmentData(id);
    if (!f) return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
    return new NextResponse(new Uint8Array(f.data), {
      headers: { "Content-Type": f.mime, "Content-Disposition": cd(f.filename) },
    });
  }
  const attachments = await dbListAttachments();
  return NextResponse.json({ attachments });
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ожидается файл" }, { status: 400 });
  }
  const file = form.get("file");
  const name = String(form.get("name") || "").trim();
  const orgKey = String(form.get("orgKey") || "").trim();
  if (!(file instanceof File)) return NextResponse.json({ error: "Не приложен файл" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) return NextResponse.json({ error: "Пустой файл" }, { status: 400 });
  if (buf.length > MAX_SIZE) return NextResponse.json({ error: "Файл больше 15 МБ" }, { status: 400 });
  const id = await dbAddAttachment({
    name: name || file.name,
    filename: file.name,
    mime: file.type || "application/octet-stream",
    orgKey,
    data: buf,
  });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });
  await dbDeleteAttachment(id);
  return NextResponse.json({ ok: true });
}
