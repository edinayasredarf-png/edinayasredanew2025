import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { refreshContentOsSources } from "@/lib/server/contentOsSourcePoll";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Ручной опрос источников («Собрать сейчас») — нет cron-слота на Vercel Hobby. */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 401 });
  }
  try {
    const result = await refreshContentOsSources(getActiveCompanyId(request));
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
