import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbAddResearchSource, dbCreateResearchPack, dbGetResearchPack } from "@/lib/server/contentOsDb";
import { generateForTask } from "@/lib/ai/router";
import { promptVersion } from "@/lib/ai/promptFiles";
import { ResearchSummarySchema } from "@/lib/ai/schemas/contentOs";
import { buildResearchSystemPrompt, buildResearchUserPrompt } from "@/lib/ai/prompts/contentOs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jsonErr(e: unknown, fallback = 500) {
  const msg = e instanceof Error ? e.message : String(e);
  const st = typeof e === "object" && e !== null && "status" in e && typeof (e as { status: unknown }).status === "number"
    ? (e as { status: number }).status : fallback;
  return NextResponse.json({ error: msg }, { status: st });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
    const { id } = await params;
    return NextResponse.json(await dbGetResearchPack(id));
  } catch (e) {
    return jsonErr(e, 401);
  }
}

interface Source { title: string; url: string; extracted_text: string }

/**
 * Собирает research pack (§22 ТЗ: search → sources → extract → verify →
 * structure). Поиск/извлечение текста источников — не наша задача здесь:
 * источники (заголовок+текст) передаются готовыми (вручную вставленными
 * или из источника мониторинга) — см. integrations.md §2 про открытый
 * вопрос выбора поискового провайдера.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    return jsonErr(e, 401);
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const sources = (body?.sources as Source[] | undefined) ?? [];
  if (sources.length === 0) return NextResponse.json({ error: "Добавьте хотя бы один источник" }, { status: 400 });

  try {
    const system = buildResearchSystemPrompt();
    const user = buildResearchUserPrompt(sources.map((s) => ({ title: s.title, text: s.extracted_text })));
    const result = await generateForTask({
      task: "research_synthesis", promptVersion: promptVersion("research"), schema: ResearchSummarySchema,
      system, user, maxTokens: 3000, dataClassification: "INTERNAL",
    });

    const packId = await dbCreateResearchPack(id, result.data.summary);
    for (const s of sources) await dbAddResearchSource({ pack_id: packId, url: s.url, title: s.title, extracted_text: s.extracted_text, verified: true });

    return NextResponse.json({ id: packId, summary: result.data.summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка синтеза research pack";
    const isConfig = e instanceof Error && e.name === "AiProviderNotConfiguredError";
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
  }
}
