import "server-only";

import {
  dbListCompanies,
  dbListChannelProfiles,
  dbListSourceItems,
  dbSetSourceItemStatus,
  dbUpsertTopic,
  dbUpsertCluster,
  dbSaveBrief,
  dbUpsertItem,
} from "@/lib/server/contentOsDb";
import { refreshContentOsSources, type SourcePollResult } from "@/lib/server/contentOsSourcePoll";
import { generateChannelDraft } from "@/lib/server/contentOsGenerate";
import { generateForTask } from "@/lib/ai/router";
import { promptVersion } from "@/lib/ai/promptFiles";
import { TopicAnalysisSchema } from "@/lib/ai/schemas/contentOs";
import { buildTopicAnalysisSystemPrompt, buildTopicAnalysisUserPrompt } from "@/lib/ai/prompts/contentOs";
import type { ContentOsChannel } from "@/lib/contentOsTypes";

/**
 * Полностью автоматический конвейер: Источники → собрать → ИИ оценивает
 * релевантность каждой новой записи → подходящие превращаются в
 * тему+кластер+бриф → черновик генерируется под каждый подключённый канал.
 *
 * Останавливается на статусе "review" — публикация и финальное утверждение
 * остаются за человеком (§18 исходного ТЗ: не публиковать AI-контент без
 * approval, пока владелец явно не переведёт систему в полностью
 * автоматический режим публикации — это отдельное, ещё не принятое решение).
 *
 * Запуск — см. /api/content-os/cron/auto-process (внешний планировщик,
 * Bearer CRON_SECRET, тот же паттерн, что у radar/refresh).
 */

const RELEVANCE_THRESHOLD = Number(process.env.CONTENT_OS_AUTO_RELEVANCE_THRESHOLD) || 7;
const MAX_ITEMS_PER_RUN = 15;

export interface AutoPipelineResult {
  companyId: string;
  polled: SourcePollResult | null;
  evaluated: number;
  created: number;
  dismissed: number;
  errors: { item: string; error: string }[];
}

export async function autoProcessCompany(companyId: string, opts: { poll?: boolean } = {}): Promise<AutoPipelineResult> {
  const result: AutoPipelineResult = { companyId, polled: null, evaluated: 0, created: 0, dismissed: 0, errors: [] };

  if (opts.poll !== false) {
    try {
      result.polled = await refreshContentOsSources(companyId);
    } catch (e) {
      result.errors.push({ item: "сбор источников", error: e instanceof Error ? e.message : String(e) });
    }
  }

  const channels = await dbListChannelProfiles(companyId);
  const connected = channels.filter((c) => c.status === "connected").map((c) => c.id);
  const targetChannels: ContentOsChannel[] = connected.length ? connected : ["article"];

  const newItems = await dbListSourceItems({ companyId, status: "new", limit: MAX_ITEMS_PER_RUN });

  for (const item of newItems) {
    result.evaluated++;
    try {
      const analysis = await generateForTask({
        task: "topic_classification",
        promptVersion: promptVersion("topic-analysis"),
        schema: TopicAnalysisSchema,
        system: buildTopicAnalysisSystemPrompt(),
        user: buildTopicAnalysisUserPrompt(item.title, item.snippet),
        maxTokens: 500,
        companyId,
        dataClassification: "PUBLIC",
      });

      if (analysis.data.relevance < RELEVANCE_THRESHOLD) {
        await dbSetSourceItemStatus(item.id, "dismissed");
        result.dismissed++;
        continue;
      }

      const topicId = await dbUpsertTopic(
        {
          title: item.title,
          source_item_id: item.id,
          thesis: item.snippet,
          relevance: analysis.data.relevance,
          popularity: analysis.data.popularity,
          status: "briefed",
        },
        companyId
      );
      await dbSetSourceItemStatus(item.id, "used");

      const clusterId = await dbUpsertCluster({ title: item.title, primary_topic_id: topicId, status: "in_production" }, companyId);
      await dbSaveBrief({
        cluster_id: clusterId,
        audience: "Широкая аудитория",
        angle: analysis.data.angle || "",
        requirements: "",
        channels: targetChannels,
        created_by: "ai",
      });

      for (const channel of targetChannels) {
        try {
          const draft = await generateChannelDraft({
            companyId,
            clusterId,
            channel,
            topicTitle: item.title,
            thesis: item.snippet,
            audience: "Широкая аудитория",
            angle: analysis.data.angle || "",
          });
          // "review", не "draft" — явный сигнал, что это сгенерировано
          // автоматически и ждёт человека, не просто пустой черновик.
          await dbUpsertItem({ cluster_id: clusterId, channel, title: draft.title, body: draft.body, status: "review" });
        } catch (e) {
          result.errors.push({ item: `${item.title} → ${channel}`, error: e instanceof Error ? e.message : String(e) });
        }
      }

      result.created++;
    } catch (e) {
      result.errors.push({ item: item.title, error: e instanceof Error ? e.message : String(e) });
      // не блокируем очередь — отмечаем как использованную, чтобы не зациклиться на одной сломанной записи
      try { await dbSetSourceItemStatus(item.id, "dismissed"); } catch { /* best effort */ }
    }
  }

  return result;
}

export async function autoProcessAllCompanies(): Promise<AutoPipelineResult[]> {
  const companies = await dbListCompanies();
  const results: AutoPipelineResult[] = [];
  for (const c of companies) {
    results.push(await autoProcessCompany(c.id));
  }
  return results;
}
