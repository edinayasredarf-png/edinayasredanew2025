import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteTemplate,
  dbInsertTemplate,
  dbListTemplates,
  dbSetTemplateSkipAuto,
} from "@/lib/server/kp/kpDb";
import { extractPlaceholders } from "@/lib/server/kp/kpDocx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function guard(request: NextRequest): Promise<NextResponse | null> {
  try {
    await requireAdminAccess(request);
    return null;
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
}

export async function GET(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const templates = await dbListTemplates();
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ожидается multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  const name = String(form.get("name") || "").trim();
  const serviceType = String(form.get("serviceType") || "").trim();
  const orgKeyRaw = String(form.get("orgKey") || "").trim();
  const orgKey = orgKeyRaw ? orgKeyRaw : null;
  const skipAutoBlocks = String(form.get("skipAutoBlocks") || "") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Не приложен файл шаблона" }, { status: 400 });
  }
  if (!serviceType) {
    return NextResponse.json({ error: "Укажите тип услуги" }, { status: 400 });
  }
  if (
    file.type !== DOCX_MIME &&
    !file.name.toLowerCase().endsWith(".docx")
  ) {
    return NextResponse.json({ error: "Шаблон должен быть в формате .docx" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let placeholders: string[] = [];
  try {
    placeholders = await extractPlaceholders(buf);
  } catch {
    return NextResponse.json(
      { error: "Не удалось прочитать .docx — файл повреждён?" },
      { status: 400 }
    );
  }

  const id = await dbInsertTemplate({
    name: name || file.name.replace(/\.docx$/i, ""),
    serviceType,
    orgKey,
    filename: file.name,
    data: buf,
    placeholders,
    skipAutoBlocks,
  });

  return NextResponse.json({ id, placeholders });
}

/** Переключить флаг «шаблон уже содержит шапку/подписанта». */
export async function PATCH(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { id?: number; skipAutoBlocks?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });
  await dbSetTemplateSkipAuto(body.id, Boolean(body.skipAutoBlocks));
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });
  await dbDeleteTemplate(id);
  return NextResponse.json({ ok: true });
}
