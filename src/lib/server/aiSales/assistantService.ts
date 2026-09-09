import "server-only";

import * as z from "zod/v4";
import { getAiProvider } from "@/lib/ai";
import { searchKnowledge, type KbHit } from "@/lib/server/aiSales/kbDb";
import { getCallById, getTranscript } from "@/lib/server/aiSales/callsDb";
import { buildDialogue } from "@/lib/server/aiSales/analysisService";
import { getScriptScore } from "@/lib/server/aiSales/scriptsDb";
import { getTimewebPool } from "@/lib/timewebPg";

/**
 * RAG-ассистент руководителя (§31 ТЗ): отвечает на вопросы, опираясь на базу
 * знаний (семантический поиск) и, при наличии, на данные конкретного звонка.
 */

const AnswerSchema = z.object({
  answer: z.string().catch(""),
});

const SYSTEM = `Ты — ассистент руководителя отдела продаж компании «Единая среда».
Отвечай на вопросы, опираясь ТОЛЬКО на предоставленные материалы базы знаний и данные звонка (если они даны).
Если информации недостаточно — честно скажи об этом, не выдумывай.
Отвечай кратко, структурировано, по делу, на русском языке. Если ссылаешься на материал — указывай его номер [N].`;

async function callContext(callId: string): Promise<string | null> {
  const call = await getCallById(callId);
  if (!call) return null;
  const parts: string[] = [];

  const pool = getTimewebPool();
  const an = await pool.query<{ data: Record<string, unknown> }>(
    `select data from ai_call_analysis where call_id = $1 order by created_at desc limit 1`,
    [callId]
  );
  const a = an.rows[0]?.data as
    | { summary?: string; dealScore?: { score?: number }; managerPerformance?: { overall?: number | null; mistakes?: string[]; didWell?: string[] }; objections?: Array<{ text?: string; handled?: boolean }> }
    | undefined;
  if (a) {
    if (a.summary) parts.push(`Сводка: ${a.summary}`);
    if (a.dealScore?.score != null) parts.push(`Оценка сделки LLM: ${a.dealScore.score}/100`);
    if (a.managerPerformance?.overall != null) parts.push(`Оценка менеджера LLM: ${a.managerPerformance.overall}/10`);
    if (a.managerPerformance?.mistakes?.length) parts.push(`Ошибки менеджера: ${a.managerPerformance.mistakes.join("; ")}`);
    if (a.managerPerformance?.didWell?.length) parts.push(`Сделано хорошо: ${a.managerPerformance.didWell.join("; ")}`);
    if (a.objections?.length) parts.push(`Возражения: ${a.objections.map((o) => `${o.text}${o.handled ? " (отработано)" : " (не отработано)"}`).join("; ")}`);
  }

  const ss = await getScriptScore(callId);
  if (ss && ss.steps.length) {
    const missed = ss.steps.filter((s) => !s.completed).map((s) => s.title);
    parts.push(`Скрипт: ${ss.score}%${missed.length ? `, не выполнено: ${missed.join(", ")}` : ""}`);
  }

  const t = await getTranscript(callId);
  if (t && (t.fullText || t.segments.length)) {
    const dialogue = buildDialogue(t).slice(0, 6000);
    parts.push(`ТРАНСКРИПТ:\n${dialogue}`);
  }
  return parts.length ? parts.join("\n") : null;
}

export interface AssistantResult {
  answer: string;
  sources: Array<{ title: string; category: string | null; score: number }>;
}

export async function askAssistant(question: string, callId?: string | null): Promise<AssistantResult> {
  const q = (question || "").trim();
  if (!q) return { answer: "Задайте вопрос.", sources: [] };

  const hits: KbHit[] = await searchKnowledge(q, 6);
  const kbBlock = hits.length
    ? hits.map((h, i) => `[${i + 1}] ${h.title}${h.category ? ` (${h.category})` : ""}:\n${h.content}`).join("\n\n")
    : "(в базе знаний нет релевантных материалов)";

  const ctx = callId ? await callContext(callId) : null;

  const provider = await getAiProvider();
  const user = `МАТЕРИАЛЫ БАЗЫ ЗНАНИЙ:\n${kbBlock}\n\n${ctx ? `ДАННЫЕ ЗВОНКА:\n${ctx}\n\n` : ""}ВОПРОС: ${q}`;

  const { data } = await provider.generateStructured({
    schema: AnswerSchema,
    system: SYSTEM,
    user,
    cacheSystem: true,
    maxTokens: 2000,
  });

  // Уникальные источники (по документу), в порядке релевантности.
  const seen = new Set<string>();
  const sources = hits
    .filter((h) => { if (seen.has(h.title)) return false; seen.add(h.title); return true; })
    .map((h) => ({ title: h.title, category: h.category, score: Math.round(h.score * 100) / 100 }));

  return { answer: data.answer || "Не удалось сформировать ответ.", sources };
}
