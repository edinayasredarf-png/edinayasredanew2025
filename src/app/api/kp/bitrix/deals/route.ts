import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { listDealsByCompany } from "@/lib/server/kp/kpBitrix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Сделки компании для выбора при генерации КП. */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }
  const companyId = new URL(request.url).searchParams.get("companyId") || "";
  if (!companyId) return NextResponse.json({ deals: [] });
  try {
    const deals = await listDealsByCompany(companyId);
    return NextResponse.json({ deals });
  } catch {
    return NextResponse.json({ deals: [] });
  }
}
