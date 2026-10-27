import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteTemplate,
  dbGetTemplateData,
  dbGetTemplateFull,
  dbInsertTemplate,
  dbListTemplates,
  dbSetTemplateSkipAuto,
  dbUpdateTemplate,
  dbUpdateDocxTemplate,
} from "@/lib/server/kp/kpDb";
import { extractPlaceholders } from "@/lib/server/kp/kpDocx";
import { extractPlaceholdersFromHtml } from "@/lib/server/kp/kpHtmlDocx";
import { docxToEditorHtml, patchDocxFromEditorHtml } from "@/lib/server/kp/kpDocxEdit";

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

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (id) {
    const full = await dbGetTemplateFull(id);
    if (!full) return NextResponse.json({ error: "Шаблон не найден" }, { status: 404 });
    let bodyHtml = full.bodyHtml;
    let docxMode = false;
    // Загруженный .docx показываем в редакторе С оформлением документа (шрифты, отступы, выравнивание);
    // сохранение вносит правки в сам .docx, не пересобирая его.
    if (full.source === "docx" && full.hasDocx) {
      const doc = await dbGetTemplateData(id);
      if (doc) {
        try {
          bodyHtml = await docxToEditorHtml(doc.data);
          docxMode = true;
        } catch {
          try {
            bodyHtml = (await mammoth.convertToHtml({ buffer: doc.data })).value;
          } catch {
            bodyHtml = "";
          }
        }
      }
    }
    return NextResponse.json({ template: { ...full, bodyHtml, docxMode } });
  }

  const templates = await dbListTemplates();
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;

  const ctype = request.headers.get("content-type") || "";

  // JSON → создание HTML-шаблона (редактируется в админке).
  if (ctype.includes("application/json")) {
    let b: {
      name?: string;
      serviceType?: string;
      orgKey?: string | null;
      bodyHtml?: string;
      skipAutoBlocks?: boolean;
    };
    try {
      b = await request.json();
    } catch {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }
    if (!b.serviceType) return NextResponse.json({ error: "Укажите тип услуги" }, { status: 400 });
    const bodyHtml = b.bodyHtml || "";
    const id = await dbInsertTemplate({
      name: b.name || "Новый шаблон",
      serviceType: b.serviceType,
      orgKey: b.orgKey || null,
      filename: `${b.name || "template"}.html`,
      data: null,
      placeholders: extractPlaceholdersFromHtml(bodyHtml),
      skipAutoBlocks: b.skipAutoBlocks ?? false,
      source: "html",
      bodyHtml,
    });
    return NextResponse.json({ id });
  }

  // multipart → загрузка .docx
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
  if (file.type !== DOCX_MIME && !file.name.toLowerCase().endsWith(".docx")) {
    return NextResponse.json({ error: "Шаблон должен быть в формате .docx" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let placeholders: string[] = [];
  try {
    placeholders = await extractPlaceholders(buf);
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать .docx — файл повреждён?" }, { status: 400 });
  }

  const id = await dbInsertTemplate({
    name: name || file.name.replace(/\.docx$/i, ""),
    serviceType,
    orgKey,
    filename: file.name,
    data: buf,
    placeholders,
    skipAutoBlocks,
    source: "docx",
  });

  return NextResponse.json({ id, placeholders });
}

export async function PATCH(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: {
    id?: number;
    skipAutoBlocks?: boolean;
    name?: string;
    serviceType?: string;
    orgKey?: string | null;
    bodyHtml?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (!body.id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });

  // Редактирование загруженного .docx: правки текста переносим в исходный файл, оформление сохраняется.
  if (typeof body.bodyHtml === "string" && body.serviceType) {
    const full = await dbGetTemplateFull(body.id);
    if (full && full.source === "docx" && full.hasDocx) {
      const doc = await dbGetTemplateData(body.id);
      if (doc) {
        try {
          const patched = await patchDocxFromEditorHtml(doc.data, body.bodyHtml);
          await dbUpdateDocxTemplate(body.id, {
            name: body.name || "Шаблон",
            serviceType: body.serviceType,
            orgKey: body.orgKey || null,
            skipAutoBlocks: body.skipAutoBlocks ?? false,
            data: patched,
            placeholders: await extractPlaceholders(patched),
          });
          return NextResponse.json({ ok: true, preserved: true });
        } catch (e) {
          return NextResponse.json({ error: `Не удалось применить правки к .docx: ${e instanceof Error ? e.message : "ошибка"}` }, { status: 500 });
        }
      }
    }
  }

  // Полное редактирование (HTML-тело задано).
  if (typeof body.bodyHtml === "string" && body.serviceType) {
    await dbUpdateTemplate(body.id, {
      name: body.name || "Шаблон",
      serviceType: body.serviceType,
      orgKey: body.orgKey || null,
      skipAutoBlocks: body.skipAutoBlocks ?? false,
      bodyHtml: body.bodyHtml,
      placeholders: extractPlaceholdersFromHtml(body.bodyHtml),
    });
    return NextResponse.json({ ok: true });
  }

  // Только переключение флага.
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
