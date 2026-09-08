import "server-only";

import { createHash } from "node:crypto";
import * as z from "zod/v4";
import { getAiProvider } from "@/lib/ai";
import { getCallById, getTranscript } from "@/lib/server/aiSales/callsDb";
import { buildDialogue } from "@/lib/server/aiSales/analysisService";
import { getDepartmentPromptForManager } from "@/lib/server/aiSales/departmentsDb";
import {
  getActiveScriptForDepartment,
  saveScriptScore,
  scriptScoreExists,
  type SalesScript,
} from "@/lib/server/aiSales/scriptsDb";

/**
 * Анализатор №6 (§18 ТЗ): оценка соблюдения скрипта продаж по звонку.
 * Отдельный LLM-вызов — независим от основного анализа, чтобы можно было менять
 * скрипт/модель и пересчитывать. Промт содержит шаги скрипта из БД (не зашит).
 */

export const SCRIPT_SCORE_PROMPT_VERSION = "script-score-v1";

const StepResult = z
  .object({
    key: z.string().catch(""),
    completed: z.boolean().catch(false),
    reason: z.string().nullable().catch(null),
  })
  .catch({ key: "", completed: false, reason: null });

const ScriptScoreSchema = z.object({
  steps: z.array(StepResult).catch([]),
});

const SYSTEM = `Ты — методолог отдела продаж. Тебе дают транскрипт телефонного разговора менеджера с клиентом и чек-лист шагов скрипта продаж.
Твоя задача — для КАЖДОГО шага скрипта определить, выполнил ли его менеджер в этом разговоре.

ПРАВИЛА:
1. Опирайся только на то, что реально было в разговоре. Не выдумывай.
2. completed=true только если шаг действительно выполнен (не формально упомянут, а отработан).
3. Если шаг неприменим к этому типу звонка (например, короткий уточняющий звонок) — completed=false и в reason кратко поясни «неприменимо: …».
4. reason — короткое обоснование (1 предложение) на русском: что именно было/не было сделано.
5. Верни массив steps строго по заданным ключам (key), по одному объекту на каждый шаг скрипта.`;

function buildUser(dialogue: string, script: SalesScript): string {
  const steps = script.steps.map((s, i) => `${i + 1}. [${s.key}] ${s.title}`).join("\n");
  return `ШАГИ СКРИПТА «${script.name}» (версия ${script.version}):\n${steps}\n\nТРАНСКРИПТ РАЗГОВОРА:\n${dialogue}\n\nОцени соблюдение КАЖДОГО шага по ключу.`;
}

export interface ScriptScoreOptions {
  force?: boolean;
}

/**
 * Прогнать оценку скрипта для звонка. Тихо пропускает, если скрипта нет/пуст или
 * таблицы ещё не мигрированы. Возвращает {skipped} или {score, steps}.
 */
export async function runScriptScoring(
  callId: string,
  opts: ScriptScoreOptions = {}
): Promise<unknown> {
  const call = await getCallById(callId);
  if (!call) return { skipped: "call not found" };

  // Скрипт отдела менеджера (или общий).
  const dept = await getDepartmentPromptForManager(call.bitrix_user_id);
  const script = await getActiveScriptForDepartment(dept?.departmentId ?? null);
  if (!script || script.steps.length === 0) return { skipped: "no active script" };

  const transcript = await getTranscript(callId);
  if (!transcript || !(transcript.fullText || transcript.segments.length)) {
    return { skipped: "no transcript" };
  }
  const dialogue = buildDialogue(transcript);

  const provider = await getAiProvider();
  const model = provider.defaultModel;
  const stepsKey = script.steps.map((s) => s.key).join(",");
  const inputHash = createHash("sha256")
    .update(`${SCRIPT_SCORE_PROMPT_VERSION}|${script.id}|v${script.version}|${stepsKey}|${model}|${dialogue}`)
    .digest("hex");

  if (!opts.force && (await scriptScoreExists(callId, inputHash))) {
    return { cached: true };
  }

  const { data } = await provider.generateStructured({
    schema: ScriptScoreSchema,
    system: SYSTEM,
    user: buildUser(dialogue, script),
    cacheSystem: true,
    maxTokens: 4000,
  });

  // Сопоставляем ответ модели со шагами скрипта по ключу (порядок и полнота — из скрипта).
  const byKey = new Map(data.steps.map((s) => [s.key, s]));
  const steps = script.steps.map((s) => {
    const r = byKey.get(s.key);
    return {
      key: s.key,
      title: s.title,
      completed: r?.completed ?? false,
      reason: r?.reason ?? null,
    };
  });
  const done = steps.filter((s) => s.completed).length;
  const score = steps.length ? Math.round((done / steps.length) * 100) : null;

  await saveScriptScore({
    callId,
    scriptId: script.id,
    scriptVersion: script.version,
    score,
    steps,
    model,
    promptVersion: SCRIPT_SCORE_PROMPT_VERSION,
    inputHash,
  });

  return { scored: true, score, done, total: steps.length };
}
