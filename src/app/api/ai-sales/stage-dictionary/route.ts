import { NextRequest, NextResponse } from "next/server";
import { requireRopAccess } from "@/lib/server/authFromBearer";
import { getDealStageDictionary, refreshDealStageDictionary } from "@/lib/server/bitrix/dealStages";
import { DEAL_STAGE_LABEL } from "@/lib/ai/dealStages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Справочник сопоставления STAGE_ID Bitrix → этап воронки (§ речевая аналитика по этапам). */
export async function GET(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  const dict = await getDealStageDictionary();
  return NextResponse.json({ dictionary: dict, canonicalLabels: DEAL_STAGE_LABEL });
}

/** Пересобрать справочник из Bitrix (crm.dealcategory.*). */
export async function POST(request: NextRequest) {
  try {
    await requireRopAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Доступно только РОП/админ" }, { status });
  }
  try {
    const dict = await refreshDealStageDictionary();
    return NextResponse.json({ ok: true, dictionary: dict, canonicalLabels: DEAL_STAGE_LABEL });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка обновления справочника";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
