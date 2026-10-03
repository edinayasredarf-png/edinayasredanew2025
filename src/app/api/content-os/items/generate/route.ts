import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/server/authFromBearer";
import { dbGetResearchPack, dbListBrandDocuments, dbListChannelProfiles, dbListItemsByCluster } from "@/lib/server/contentOsDb";
import { generateForTask } from "@/lib/ai/router";
import { getActiveCompanyId } from "@/lib/server/contentOsCompany";
import { promptVersion } from "@/lib/ai/promptFiles";
import { ContentOsDraftSchema } from "@/lib/ai/schemas/contentOs";
import {
  buildChannelSystemPrompt,
  buildChannelUserPrompt,
  buildWriterSystemPrompt,
  buildWriterUserPrompt,
} from "@/lib/ai/prompts/contentOs";
import type { ContentOsChannel } from "@/lib/contentOsTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface GenerateBody {
  clusterId?: string;
  channel?: ContentOsChannel;
  topicTitle?: string;
  thesis?: string;
  audience?: string;
  angle?: string;
  requirements?: string;
  contentItemId?: string;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminAccess(request);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 401;
    return NextResponse.json({ error: "Нет доступа" }, { status });
  }

  let body: GenerateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (!body.topicTitle?.trim()) return NextResponse.json({ error: "Укажите тему" }, { status: 400 });
  if (!body.channel) return NextResponse.json({ error: "Укажите канал" }, { status: 400 });
  if (!body.clusterId) return NextResponse.json({ error: "Укажите кластер" }, { status: 400 });

  const companyId = getActiveCompanyId(request);
  const [channels, brandDocs, existingItems, researchPack] = await Promise.all([
    dbListChannelProfiles(companyId),
    dbListBrandDocuments(companyId),
    dbListItemsByCluster(body.clusterId),
    dbGetResearchPack(body.clusterId),
  ]);
  const channel = channels.find((c) => c.id === body.channel);
  if (!channel) return NextResponse.json({ error: "Канал не найден" }, { status: 404 });

  const audience = body.audience || "Широкая аудитория";
  const angle = body.angle || "";

  try {
    let system: string;
    let user: string;
    let promptFile: string;
    let task: "first_draft" | "channel_adaptation";

    if (body.channel === "article") {
      task = "first_draft";
      promptFile = "writer";
      system = buildWriterSystemPrompt(brandDocs);
      user = buildWriterUserPrompt({
        topicTitle: body.topicTitle, thesis: body.thesis, audience, angle,
        requirements: body.requirements, researchSummary: researchPack?.summary,
      });
    } else {
      task = "channel_adaptation";
      promptFile = body.channel;
      const baseArticle = existingItems.find((i) => i.channel === "article" && i.body.trim());
      system = buildChannelSystemPrompt(channel, brandDocs);
      user = buildChannelUserPrompt({
        topicTitle: body.topicTitle, thesis: body.thesis, audience, angle,
        requirements: body.requirements, baseArticleBody: baseArticle?.body,
      });
    }

    const result = await generateForTask({
      task,
      promptVersion: promptVersion(promptFile),
      schema: ContentOsDraftSchema,
      system,
      user,
      maxTokens: 4000,
      contentItemId: body.contentItemId,
      companyId,
      dataClassification: "INTERNAL",
    });

    return NextResponse.json({ title: result.data.title, body: result.data.body, model: result.model });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка генерации";
    const isConfig = e instanceof Error && e.name === "AiProviderNotConfiguredError";
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
  }
}
