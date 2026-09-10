import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbAddServiceType,
  dbDeleteServiceType,
  dbListServiceTypes,
  dbRenameServiceType,
  dbSetServiceFormula,
  dbSetServiceTypeActive,
} from "@/lib/server/kp/kpDb";
import { validateFormula } from "@/lib/server/kp/kpFormula";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const services = await dbListServiceTypes();
  return NextResponse.json({ services });
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Укажите название услуги" }, { status: 400 });
  const existing = await dbListServiceTypes();
  await dbAddServiceType(name, existing.length + 1);
  return NextResponse.json({ ok: true });
}

/** Переименование ({oldName,newName}) или вкл/выкл ({name,isActive}). */
export async function PATCH(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  let body: {
    oldName?: string;
    newName?: string;
    name?: string;
    isActive?: boolean;
    rowFormula?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  if (body.oldName && body.newName) {
    await dbRenameServiceType(body.oldName, body.newName);
    return NextResponse.json({ ok: true });
  }
  if (body.name && typeof body.rowFormula === "string") {
    // Проверяем формулу на тестовых значениях перед сохранением.
    const check = validateFormula(body.rowFormula.trim() || "max(area_ha, min_ha) * price", {
      area_ha: 5, area_sqm: 50000, quantity: 10, distance_km: 3,
      min_ha: 1, price: 200000, price_direct: 200000, price_tender: 240000,
    });
    if (!check.ok) return NextResponse.json({ error: `Ошибка формулы: ${check.error}` }, { status: 400 });
    await dbSetServiceFormula(body.name, body.rowFormula.trim());
    return NextResponse.json({ ok: true, sample: check.result });
  }
  if (body.name && typeof body.isActive === "boolean") {
    await dbSetServiceTypeActive(body.name, body.isActive);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Нет данных для изменения" }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const name = new URL(request.url).searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Не указано название" }, { status: 400 });
  await dbDeleteServiceType(name);
  return NextResponse.json({ ok: true });
}
