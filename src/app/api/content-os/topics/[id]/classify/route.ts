import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetTopic, dbUpsertTopic } from "@/lib/server/contentOsDb";
import { generateForTask } from "@/lib/ai/router";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";
import { promptVersion } from "@/lib/ai/promptFiles";
import { TopicAnalysisSchema } from "@/lib/ai/schemas/contentOs";
import { buildTopicAnalysisSystemPrompt, buildTopicAnalysisUserPrompt } from "@/lib/ai/prompts/contentOs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Классификация темы (§19 ТЗ: topic extraction → classification). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  const { id } = await params;
  const topic = await dbGetTopic(id);
  if (!topic) return NextResponse.json({ error: "Тема не найдена" }, { status: 404 });

  try {
    const result = await generateForTask({
      task: "topic_classification",
      promptVersion: promptVersion("topic-analysis"),
      schema: TopicAnalysisSchema,
      system: buildTopicAnalysisSystemPrompt(),
      user: buildTopicAnalysisUserPrompt(topic.title, topic.thesis),
      maxTokens: 500,
      companyId: getActiveCompanyId(request),
      dataClassification: "PUBLIC",
    });
    await dbUpsertTopic({ id, relevance: result.data.relevance, popularity: result.data.popularity });
    return NextResponse.json(result.data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка классификации";
    const isConfig = e instanceof Error && e.name === "AiProviderNotConfiguredError";
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
  }
}
