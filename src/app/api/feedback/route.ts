import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteCitizenFeedback,
  dbInsertCitizenFeedback,
  dbInsertFeedbackFile,
  dbListCitizenFeedback,
  dbSetCitizenFeedbackHandled,
} from "@/lib/server/citizenFeedbackDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILES = 8;
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 МБ на файл

// Логин гостевого доступа (публичный e-mail). Пароль — только из ENV, не в git.
const GUEST_LOGIN = "info-edinayasreda.rf@yandex.ru";
function guestCredentials(): { login: string; password: string } | null {
  const password = (process.env.ES_GUEST_PASSWORD || "").trim();
  if (!password) return null;
  return { login: (process.env.ES_GUEST_LOGIN || GUEST_LOGIN).trim(), password };
}

interface Fields {
  type: string;
  fio: string;
  phone: string;
  email: string;
  region: string;
  message: string;
  source: string;
  company: string; // honeypot
}

// Публичная отправка формы с кампейн-страницы (JSON или multipart с файлами).
export async function POST(request: NextRequest) {
  const ct = request.headers.get("content-type") || "";
  const isMultipart = ct.includes("multipart/form-data");

  const fields: Fields = { type: "", fio: "", phone: "", email: "", region: "", message: "", source: "", company: "" };
  let files: File[] = [];

  try {
    if (isMultipart) {
      const fd = await request.formData();
      const g = (k: string) => (fd.get(k) ?? "").toString();
      fields.type = g("type");
      fields.fio = g("fio");
      fields.phone = g("phone");
      fields.email = g("email");
      fields.region = g("region");
      fields.message = g("message");
      fields.source = g("source");
      fields.company = g("company");
      files = fd.getAll("files").filter((x): x is File => x instanceof File && x.size > 0);
    } else {
      const body = await request.json();
      Object.assign(fields, {
        type: body.type ?? "",
        fio: body.fio ?? "",
        phone: body.phone ?? "",
        email: body.email ?? "",
        region: body.region ?? "",
        message: body.message ?? "",
        source: body.source ?? "",
        company: body.company ?? "",
      });
    }
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  // honeypot: скрытое поле заполняют боты
  if (fields.company) return NextResponse.json({ ok: true });

  const type = fields.type === "access" ? "access" : "info";
  const fio = fields.fio.trim();
  const phone = fields.phone.trim();
  const email = fields.email.trim();

  if (!email) return NextResponse.json({ error: "Укажите email" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Некорректный email" }, { status: 400 });

  // Валидация файлов до записи
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Слишком много файлов (макс. ${MAX_FILES})` }, { status: 400 });
  }
  for (const file of files) {
    const okType = file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!okType) return NextResponse.json({ error: "Разрешены только фото и видео" }, { status: 400 });
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `Файл «${file.name}» больше 50 МБ` }, { status: 413 });
    }
  }

  let feedbackId: string;
  try {
    feedbackId = await dbInsertCitizenFeedback({
      type, fio, phone, email,
      region: fields.region,
      message: fields.message,
      source: fields.source || "pomosh",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сохранения";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Сохраняем прикреплённые файлы (ошибка одного не рушит заявку)
  for (const file of files) {
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      await dbInsertFeedbackFile(feedbackId, file.name, file.type, buf);
    } catch { /* пропускаем битый файл */ }
  }

  const credentials = type === "access" ? guestCredentials() : null;
  return NextResponse.json({ ok: true, credentials });
}

// Список — только админ.
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const sp = request.nextUrl.searchParams;
    const rows = await dbListCitizenFeedback({
      type: sp.get("type") || undefined,
      limit: sp.get("limit") ? Number(sp.get("limit")) : undefined,
    });
    return NextResponse.json(rows);
  } catch (e) {
    const st = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status: st });
  }
}

// Отметка «обработано» — админ.
export async function PATCH(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const body = (await request.json()) as { id?: string; handled?: boolean };
    if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbSetCitizenFeedbackHandled(body.id, Boolean(body.handled));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const st = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status: st });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminAccess(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await dbDeleteCitizenFeedback(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const st = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status: st });
  }
}
