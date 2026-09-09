import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import {
  dbDeleteOrganization,
  dbListOrganizations,
  dbListTiers,
  dbUpsertOrganization,
  dbUpsertTier,
  type KpOrganization,
  type KpTier,
} from "@/lib/server/kp/kpDb";

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
  const [organizations, tiers] = await Promise.all([dbListOrganizations(), dbListTiers()]);
  return NextResponse.json({ organizations, tiers });
}

/** Создать/обновить компанию вместе с её ценами (тирами) по услугам. */
export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;

  let body: { org?: Partial<KpOrganization>; tiers?: KpTier[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const org = body.org;
  if (!org?.key?.trim() || !org.name?.trim()) {
    return NextResponse.json({ error: "Укажите ключ и название компании" }, { status: 400 });
  }
  const key = org.key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!key) return NextResponse.json({ error: "Ключ: латиница/цифры" }, { status: 400 });

  const full: KpOrganization = {
    key,
    name: org.name.trim(),
    shortName: (org.shortName || org.name).trim(),
    directorRole: org.directorRole || "",
    directorFio: org.directorFio || "",
    requisites: org.requisites || "",
    phone: org.phone || "",
    email: org.email || "",
    headerImage: org.headerImage || "",
    headerText: org.headerText || "",
    stampImage: org.stampImage || "",
    signatureImage: org.signatureImage || "",
    writeKpNumber: org.writeKpNumber ?? true,
    mailAccountId: org.mailAccountId ?? null,
    isActive: org.isActive ?? true,
    sortOrder: org.sortOrder ?? 0,
  };
  await dbUpsertOrganization(full);

  for (const t of body.tiers || []) {
    if (!t?.serviceType) continue;
    await dbUpsertTier({
      orgKey: key,
      serviceType: t.serviceType,
      pricePerHaDirect: Number(t.pricePerHaDirect) || 0,
      pricePerHaTender: Number(t.pricePerHaTender) || 0,
      aisPrice: Number(t.aisPrice) || 0,
      renewalPerYear: Number(t.renewalPerYear) || 0,
      minHectares: Number(t.minHectares) || 1,
    });
  }

  return NextResponse.json({ ok: true, key });
}

export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const key = new URL(request.url).searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Не указан key" }, { status: 400 });
  await dbDeleteOrganization(key);
  return NextResponse.json({ ok: true });
}
