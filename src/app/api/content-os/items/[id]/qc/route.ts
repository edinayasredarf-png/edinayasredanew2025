import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbAddQcCheck, dbGetItem, dbListBrandDocuments, dbListFactChecks, dbListQcChecks } from "@/lib/server/contentOsDb";
import { generateForTask } from "@/lib/ai/router";
import { promptVersion } from "@/lib/ai/promptFiles";
import { QcResultSchema } from "@/lib/ai/schemas/contentOs";
import { buildQcPrompt, buildQcUserPrompt } from "@/lib/ai/prompts/contentOs";
import type { QcCheckType } from "@/lib/contentOsTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
    ? (e as { status: number }).status : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

const CHECK_TYPES: QcCheckType[] = ["brand", "seo", "fact"];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
    const { id } = await params;
    return NextResponse.json(await dbListQcChecks(id));
  } catch (e) {
    return jsonErr(e, 401);
  }
}

/** Запускает QC-проверку (§27 ТЗ: Brand → SEO → Fact) через AI Gateway. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return jsonErr(e, 401);
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const checkType = body?.check_type as QcCheckType | undefined;
  if (!checkType || !CHECK_TYPES.includes(checkType)) {
    return NextResponse.json({ error: "check_type должен быть brand|seo|fact" }, { status: 400 });
  }

  const item = await dbGetItem(id);
  if (!item) return NextResponse.json({ error: "Материал не найден" }, { status: 404 });
  if (!item.body.trim()) return NextResponse.json({ error: "Текст пуст — нечего проверять" }, { status: 400 });

  try {
    const brandDocs = checkType === "brand" ? await dbListBrandDocuments() : [];
    const factChecks = checkType === "fact" ? await dbListFactChecks(id) : [];
    const researchSummary = factChecks.length ? factChecks.map((f) => `${f.claim} — ${f.verdict}${f.source_url ? ` (${f.source_url})` : ""}`).join("\n") : undefined;

    const system = buildQcPrompt(checkType, { brandDocs });
    const user = buildQcUserPrompt(checkType, item.body, researchSummary);
    const task = checkType === "brand" ? "brand_check" : checkType === "seo" ? "seo_check" : "fact_check";
    const promptFile = checkType === "brand" ? "brand-check" : checkType === "seo" ? "seo-check" : "fact-check";

    const result = await generateForTask({
      task, promptVersion: promptVersion(promptFile), schema: QcResultSchema, system, user,
      maxTokens: 1500, contentItemId: id, dataClassification: "INTERNAL",
    });

    const checkId = await dbAddQcCheck({ content_item_id: id, check_type: checkType, status: result.data.status.toLowerCase() as "pass" | "review" | "fail", notes: result.data.notes });
    return NextResponse.json({ id: checkId, status: result.data.status, notes: result.data.notes });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка проверки";
    const isConfig = e instanceof Error && e.name === "AiProviderNotConfiguredError";
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
  }
}
