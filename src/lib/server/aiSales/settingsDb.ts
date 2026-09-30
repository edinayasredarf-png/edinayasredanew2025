import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import type { AiJobType } from "@/lib/server/aiSales/jobsDb";

/**
 * Настройки AI Sales (§84-85 ТЗ) — таблица ai_settings (key → jsonb value).
 * Значения по умолчанию заданы в миграции. Здесь — чтение/запись + типизованные
 * геттеры для сервисов (провайдер, модель, включён ли анализ).
 */

export type SettingsMap = Record<string, unknown>;

export async function getAllSettings(): Promise<SettingsMap> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ key: string; value: unknown }>(`select key, value from ai_settings`);
  const map: SettingsMap = {};
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function setSetting(key: string, value: unknown, userId?: string | null): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(
    `insert into ai_settings (key, value, updated_at, updated_by)
     values ($1, $2::jsonb, now(), $3)
     on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = excluded.updated_by`,
    [key, JSON.stringify(value), userId ?? null]
  );
}

/** Разрешённые к записи из UI ключи (белый список — не даём писать произвольное). */
export const EDITABLE_KEYS = new Set<string>([
  "ai.provider",
  "ai.model.analysis",
  "ai.analysis_enabled",
  "ai.confidence_threshold",
  "transcription.provider",
  "diarization.provider",
  "bitrix.auto_write",
  "bitrix.auto_create_tasks",
  "retention.transcript_days",
  // Ручные переопределения авто-сопоставления STAGE_ID → этап воронки
  // (src/lib/server/bitrix/dealStages.ts), на случай нетипичной формулировки
  // названия стадии в Bitrix.
  "aiSales.stageOverrides",
  // Ручные переопределения промта анализа по этапу воронки (замена блока из
  // src/lib/ai/prompts/dealStagePrompts.ts) — Record<StageKey, string>,
  // пусто/отсутствует значение = используется стандартный промт этапа.
  "aiSales.stagePromptOverrides",
]);

/* ── Типизованные геттеры для сервисов (с фолбэком на env) ── */

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ value: unknown }>(`select value from ai_settings where key = $1`, [key]);
  return (rows[0]?.value as T) ?? fallback;
}

/** Провайдер транскрибации: сначала БД (ai_settings), потом env, потом yandex. */
export async function getTranscriptionSetting(): Promise<string> {
  return getSetting<string>("transcription.provider", (process.env.TRANSCRIPTION_PROVIDER || "yandex").trim());
}

/** Провайдер диаризации: yandex (метки самого STT) | pyannote (self-hosted). */
export async function getDiarizationSetting(): Promise<string> {
  return getSetting<string>("diarization.provider", (process.env.DIARIZATION_PROVIDER || "yandex").trim());
}

/** Провайдер + модель анализа: сначала БД (ai_settings), потом env. */
export async function getAiConfig(): Promise<{ provider: string; analysisModel: string | undefined; analysisEnabled: boolean }> {
  const [provider, analysisModel, enabled] = await Promise.all([
    getSetting<string>("ai.provider", (process.env.AI_PROVIDER || "anthropic").trim()),
    getSetting<string | undefined>("ai.model.analysis", process.env.AI_MODEL_ANALYSIS?.trim()),
    getSetting<boolean>("ai.analysis_enabled", true),
  ]);
  return { provider, analysisModel, analysisEnabled: enabled !== false };
}

/** Задачи разметки ролей и LLM-анализа — долго на self-hosted CPU, быстро в облаке. */
export const ANALYSIS_JOB_TYPES: AiJobType[] = ["call.roles", "call.analyze", "deal.analyze"];

const VERCEL_BASE_JOB_TYPES: AiJobType[] = [
  "bitrix.sync",
  "call.ingest",
  "call.transcribe",
  "call.diarize",
];

/** Провайдер анализа через свой OpenAI-совместимый сервер (GigaChat на VPS). */
export function isSelfHostedAiProvider(provider: string): boolean {
  const p = provider.trim().toLowerCase();
  return p === "selfhosted" || p === "local" || p === "openai";
}

/** Типы задач для Vercel-дренажа: облачный AI — анализ здесь (env Vercel), self-hosted — только на VPS. */
export async function getVercelDrainJobTypes(): Promise<AiJobType[]> {
  const { provider } = await getAiConfig();
  if (isSelfHostedAiProvider(provider)) return [...VERCEL_BASE_JOB_TYPES];
  return [...VERCEL_BASE_JOB_TYPES, ...ANALYSIS_JOB_TYPES];
}

/** Типы для VPS-воркера: только когда в настройках выбран self-hosted LLM. */
export async function getVpsWorkerJobTypes(): Promise<AiJobType[]> {
  const { provider } = await getAiConfig();
  if (isSelfHostedAiProvider(provider)) return [...ANALYSIS_JOB_TYPES];
  return [];
}
