import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteCitizenFeedback,
  dbInsertCitizenFeedback,
  dbListCitizenFeedback,
  dbSetCitizenFeedbackHandled,
} from "@/lib/server/citizenFeedbackDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Логин гостевого доступа (публичный e-mail). Пароль — только из ENV, не в git.
const GUEST_LOGIN = "info-edinayasreda.rf@yandex.ru";
function guestCredentials(): { login: string; password: string } | null {
  const password = (process.env.ES_GUEST_PASSWORD || "").trim();
  if (!password) return null;
  return { login: (process.env.ES_GUEST_LOGIN || GUEST_LOGIN).trim(), password };
}

// Публичная отправка формы с кампейн-страницы.
export async function POST(request: NextRequest) {
  let body: {
    type?: string;
    fio?: string;
    phone?: string;
    email?: string;
    region?: string;
    message?: string;
    source?: string;
    company?: string; // honeypot
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  // honeypot: скрытое поле должно быть пустым (боты его заполняют)
  if (body.company) return NextResponse.json({ ok: true });

  const type = body.type === "access" ? "access" : "info";
  const fio = (body.fio || "").trim();
  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim();

  if (!fio) return NextResponse.json({ error: "Укажите ФИО" }, { status: 400 });
  if (!phone && !email) {
    return NextResponse.json({ error: "Укажите телефон или email" }, { status: 400 });
  }
  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }

  try {
    await dbInsertCitizenFeedback({
      type,
      fio,
      phone,
      email,
      region: body.region,
      message: body.message,
      source: body.source || "pomosh",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка сохранения";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Для заявки на доступ отдаём гостевые учётные данные (если заданы в ENV).
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
