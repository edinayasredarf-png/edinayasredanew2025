import "server-only";

import { dbGetResearchPack, dbListBrandDocuments, dbListChannelProfiles, dbListItemsByCluster } from "@/lib/server/contentOsDb";
import { generateForTask } from "@/lib/ai/router";
import { promptVersion } from "@/lib/ai/promptFiles";
import { ContentOsDraftSchema } from "@/lib/ai/schemas/contentOs";
import { buildChannelSystemPrompt, buildChannelUserPrompt, buildWriterSystemPrompt, buildWriterUserPrompt } from "@/lib/ai/prompts/contentOs";
import type { ContentOsChannel } from "@/lib/contentOsTypes";

export interface GenerateChannelDraftInput {
  companyId: string;
  clusterId: string;
  channel: ContentOsChannel;
  topicTitle: string;
  thesis?: string;
  audience?: string;
  angle?: string;
  requirements?: string;
  contentItemId?: string;
}

export interface GenerateChannelDraftResult {
  title: string;
  body: string;
  model: string;
}

/**
 * Генерация черновика под канал — общая логика для ручной кнопки
 * «Сгенерировать» (items/generate/route.ts) и автоматического конвейера
 * (contentOsAutoPipeline.ts). Раньше жила только в роуте — вынесена сюда,
 * чтобы не дублировать сборку промптов в двух местах.
 */
export async function generateChannelDraft(input: GenerateChannelDraftInput): Promise<GenerateChannelDraftResult> {
  const [channels, brandDocs, existingItems, researchPack] = await Promise.all([
    dbListChannelProfiles(input.companyId),
    dbListBrandDocuments(input.companyId),
    dbListItemsByCluster(input.clusterId),
    dbGetResearchPack(input.clusterId),
  ]);
  const channel = channels.find((c) => c.id === input.channel);
  if (!channel) throw new Error(`Канал «${input.channel}» не найден`);

  const audience = input.audience || "Широкая аудитория";
  const angle = input.angle || "";

  let system: string;
  let user: string;
  let promptFile: string;
  let task: "first_draft" | "channel_adaptation";

  if (input.channel === "article") {
    task = "first_draft";
    promptFile = "writer";
    system = buildWriterSystemPrompt(brandDocs);
    user = buildWriterUserPrompt({
      topicTitle: input.topicTitle, thesis: input.thesis, audience, angle,
      requirements: input.requirements, researchSummary: researchPack?.summary,
    });
  } else {
    task = "channel_adaptation";
    promptFile = input.channel;
    const baseArticle = existingItems.find((i) => i.channel === "article" && i.body.trim());
    system = buildChannelSystemPrompt(channel, brandDocs);
    user = buildChannelUserPrompt({
      topicTitle: input.topicTitle, thesis: input.thesis, audience, angle,
      requirements: input.requirements, baseArticleBody: baseArticle?.body,
    });
  }

  const result = await generateForTask({
    task,
    promptVersion: promptVersion(promptFile),
    schema: ContentOsDraftSchema,
    system,
    user,
    maxTokens: 4000,
    contentItemId: input.contentItemId,
    companyId: input.companyId,
    dataClassification: "INTERNAL",
  });

  return { title: result.data.title, body: result.data.body, model: result.model };
}
