import "server-only";

import { createHash } from "node:crypto";
import { getAiProvider } from "@/lib/ai";
import { CallAnalysisSchema, ANALYSIS_VERSION } from "@/lib/ai/schemas/callAnalysis";
import {
  CALL_ANALYSIS_SYSTEM,
  CALL_ANALYSIS_PROMPT_VERSION,
  buildCallAnalysisUser,
} from "@/lib/ai/prompts/callAnalysis";
import {
  getCallById,
  getTranscript,
  setCallStatus,
  setCallProduct,
  saveAnalysis,
  analysisExists,
  type TranscriptWithSegments,
} from "@/lib/server/aiSales/callsDb";
import { getTimewebPool } from "@/lib/timewebPg";
import { enqueueJob } from "@/lib/server/aiSales/jobsDb";
import { createFollowUpsFromAnalysis } from "@/lib/server/aiSales/followupsDb";

/**
 * Анализ звонка через Claude (§45 ТЗ). Классификация/скоринг — LLM; агрегация и
 * счётчики — обычный SQL/код. Кэш по input_hash (§54): один и тот же транскрипт с
 * той же версией промпта не гоняем повторно.
 */

const mskTime = (ms: number | null): string => {
  if (ms == null) return "";
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `[${h}:${m}:${s}] `;
};

/** Собрать диалог для промпта: роли (если размечены) + таймкоды. */
function buildDialogue(t: TranscriptWithSegments): string {
  if (!t.segments.length) return t.fullText || "";
  return t.segments
    .map((s) => {
      const role =
        s.role === "MANAGER" ? "Менеджер" : s.role === "CLIENT" ? "Клиент" : s.speakerLabel || "Говорящий";
      return `${mskTime(s.startMs)}${role}: ${s.text}`;
    })
    .join("\n");
}

interface CallContext {
  companyTitle: string | null;
  dealTitle: string | null;
  managerName: string | null;
}

async function loadContext(call: {
  bitrix_company_id: string | null;
  bitrix_deal_id: string | null;
  bitrix_user_id: string | null;
}): Promise<CallContext> {
  const pool = getTimewebPool();
  const [company, deal, manager] = await Promise.all([
    call.bitrix_company_id
      ? pool.query<{ title: string | null }>(`select title from ai_companies where bitrix_company_id = $1`, [call.bitrix_company_id])
      : Promise.resolve({ rows: [] as { title: string | null }[] }),
    call.bitrix_deal_id
      ? pool.query<{ title: string | null }>(`select title from ai_deals where bitrix_deal_id = $1`, [call.bitrix_deal_id])
      : Promise.resolve({ rows: [] as { title: string | null }[] }),
    call.bitrix_user_id
      ? pool.query<{ full_name: string | null }>(`select full_name from ai_managers where bitrix_user_id = $1`, [call.bitrix_user_id])
      : Promise.resolve({ rows: [] as { full_name: string | null }[] }),
  ]);
  return {
    companyTitle: company.rows[0]?.title ?? null,
    dealTitle: deal.rows[0]?.title ?? null,
    managerName: manager.rows[0]?.full_name ?? null,
  };
}

export interface AnalyzeOptions {
  force?: boolean; // повторный анализ несмотря на кэш
}

export async function runAnalysis(
  callId: string,
  opts: AnalyzeOptions = {}
): Promise<unknown> {
  const call = await getCallById(callId);
  if (!call) throw new Error(`Звонок не найден: ${callId}`);

  const transcript = await getTranscript(callId);
  if (!transcript || !(transcript.fullText || transcript.segments.length)) {
    throw new Error("Нет транскрипта для анализа");
  }

  const dialogue = buildDialogue(transcript);
  const provider = getAiProvider();
  const model = provider.defaultModel;

  const inputHash = createHash("sha256")
    .update(`${CALL_ANALYSIS_PROMPT_VERSION}|${model}|${dialogue}`)
    .digest("hex");

  if (!opts.force && (await analysisExists(callId, inputHash))) {
    return { cached: true };
  }

  await setCallStatus(callId, "ANALYZING");

  const ctx = await loadContext(call);
  const callDate = call.started_at ? new Date(call.started_at).toISOString().slice(0, 10) : null;
  const user = buildCallAnalysisUser(dialogue, { ...ctx, callDate });

  const { data } = await provider.generateStructured({
    schema: CallAnalysisSchema,
    system: CALL_ANALYSIS_SYSTEM,
    user,
    cacheSystem: true,
    maxTokens: 16000,
  });

  await saveAnalysis({
    callId,
    provider: provider.name,
    model,
    promptVersion: CALL_ANALYSIS_PROMPT_VERSION,
    analysisVersion: ANALYSIS_VERSION,
    inputHash,
    data,
  });

  // Топовый продукт → в карточку звонка (простая производная, не LLM).
  const topProduct = [...data.products].sort((a, b) => b.confidence - a.confidence)[0];
  await setCallProduct(callId, topProduct?.name ?? null);

  // Follow-ups из обещаний менеджера (§35).
  await createFollowUpsFromAnalysis(callId, data, call);

  await setCallStatus(callId, "COMPLETED");

  // Пересчёт агрегата по сделке (кэш по дайджесту не даст лишней работы LLM).
  if (call.bitrix_deal_id) {
    await enqueueJob({ type: "deal.analyze", payload: { dealId: call.bitrix_deal_id }, priority: 70 });
  }

  return {
    analyzed: true,
    dealScore: data.dealScore.score,
    temperature: data.dealScore.temperature,
    managerScore: data.managerPerformance.overall,
  };
}
