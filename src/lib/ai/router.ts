import "server-only";

import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { OpenAiCompatProvider } from "@/lib/ai/providers/openaiCompat";
import type { AiProvider, StructuredRequest, StructuredResult } from "@/lib/ai/interfaces";
import { dbLogAiRun } from "@/lib/server/contentOsDb";
import type { ContentOsTask } from "@/lib/contentOsTypes";

/**
 * Content OS Model Router (docs/content-os/architecture.md §2). Задача →
 * провайдер, с обязательным fallback (не опция) — если local недоступен/
 * упал/вернул невалидный JSON, тихо уходим на Claude, событие логируется в
 * content_ai_runs. Пока SELFHOSTED_LLM_URL не настроен (VPS ещё не куплен) —
 * все задачи фактически идут через fallback, это ожидаемо.
 */

type ProviderKey = "local" | "anthropic";
interface TaskRoute { provider: ProviderKey; model?: string; fallback: ProviderKey }

// Первое время first_draft — на anthropic по умолчанию (качество local для
// черновиков ещё не сверено вживую, см. architecture.md §2 «Бенчмарк перед
// боевым использованием»). Включается флагом после бенчмарка.
const TRY_LOCAL_FIRST_DRAFT = process.env.CONTENT_OS_FIRST_DRAFT_LOCAL === "true";

export const TASK_ROUTES: Record<ContentOsTask, TaskRoute> = {
  topic_classification: { provider: "local", fallback: "anthropic" },
  duplicate_detection: { provider: "local", fallback: "anthropic" },
  brand_check: { provider: "local", fallback: "anthropic" },
  first_draft: { provider: TRY_LOCAL_FIRST_DRAFT ? "local" : "anthropic", fallback: "anthropic" },
  channel_adaptation: { provider: "local", fallback: "anthropic" },
  research_synthesis: { provider: "anthropic", model: "claude-opus-5", fallback: "anthropic" },
  final_editorial: { provider: "anthropic", model: "claude-opus-5", fallback: "anthropic" },
  seo_check: { provider: "local", fallback: "anthropic" },
  fact_check: { provider: "anthropic", model: "claude-sonnet-5", fallback: "anthropic" },
};

function buildProvider(key: ProviderKey, model?: string): AiProvider {
  if (key === "local") return new OpenAiCompatProvider({ defaultModel: model });
  return new AnthropicProvider({ defaultModel: model });
}

export interface ContentOsGenerateOptions<T> extends Pick<StructuredRequest<T>, "schema" | "system" | "user" | "maxTokens" | "cacheSystem"> {
  task: ContentOsTask;
  /** Версия промпт-файла из prompts/*.md (§33 ТЗ) — для трассировки в content_ai_runs. */
  promptVersion?: number;
  contentItemId?: string;
  dataClassification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL";
}

async function logRun(
  task: ContentOsTask,
  promptVersion: number | undefined,
  provider: ProviderKey,
  status: "ok" | "fallback",
  model: string,
  latencyMs: number,
  usage: { inputTokens: number; outputTokens: number },
  contentItemId?: string,
  dataClassification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL",
  error?: string
): Promise<void> {
  try {
    await dbLogAiRun({
      task, promptVersion: promptVersion ?? null, provider, model, contentItemId: contentItemId ?? null,
      dataClassification: dataClassification ?? "INTERNAL",
      inputTokens: usage.inputTokens, outputTokens: usage.outputTokens,
      latencyMs, status, error: error ?? null,
    });
  } catch {
    // наблюдаемость не должна ронять генерацию
  }
}

/** Генерация по задаче Content OS — единственная точка входа для бизнес-логики (§54 ТЗ). */
export async function generateForTask<T>(opts: ContentOsGenerateOptions<T>): Promise<StructuredResult<T>> {
  const route = TASK_ROUTES[opts.task];
  const req: StructuredRequest<T> = {
    schema: opts.schema, system: opts.system, user: opts.user,
    maxTokens: opts.maxTokens, cacheSystem: opts.cacheSystem,
  };

  const primary = buildProvider(route.provider, route.model);
  const started = Date.now();
  try {
    const result = await primary.generateStructured(req);
    await logRun(opts.task, opts.promptVersion, route.provider, "ok", result.model, Date.now() - started, result.usage, opts.contentItemId, opts.dataClassification);
    return result;
  } catch (e) {
    if (route.provider === route.fallback) throw e;
    const fallback = buildProvider(route.fallback, route.model);
    const fbStarted = Date.now();
    const result = await fallback.generateStructured(req);
    await logRun(
      opts.task, opts.promptVersion, route.fallback, "fallback", result.model, Date.now() - fbStarted, result.usage,
      opts.contentItemId, opts.dataClassification, e instanceof Error ? e.message : String(e)
    );
    return result;
  }
}
