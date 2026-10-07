import "server-only";

import { BRIEF_COMPOSE_PROMPT_DEFAULT, BRIEF_SEARCH_PROMPT_DEFAULT } from "@/lib/ai/prompts/briefPrompts";
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
  // Отдельные модели для задач, где общая "ai.model.analysis" не подходит —
  // разметка ролей и RAG-ассистент по базе знаний часто выгоднее решать более
  // дешёвой/быстрой моделью, чем полный анализ звонка. Пусто — используется
  // ai.model.analysis (см. getTaskModel).
  "ai.model.roles",
  "ai.model.rag",
  // Брифы по лидам/сделкам (AI Gateway): модель поиска в интернете и модель сборки брифа.
  "ai.model.briefSearch",
  "ai.model.brief",
  // Свои тексты промтов брифа (пусто — стандартные из src/lib/ai/prompts/briefPrompts.ts).
  "ai.brief.promptSearch",
  "ai.brief.promptBrief",
  // Рассылка в Bitrix: Bitrix-ID РОПов (через запятую) для брифов по отложенным сделкам; личные сообщения менеджерам «как лучше ответить».
  "briefs.ropBitrixUserIds",
  "briefs.coachEnabled",
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

/**
 * Модель для конкретной задачи (`ai.model.roles` / `ai.model.rag`), с
 * фолбэком на общую `ai.model.analysis` — задавать её отдельно нужно только
 * если для этой задачи явно хочется другую модель (напр. подешевле для
 * разметки ролей). Передать как `model` в `generateStructured` — пусто
 * означает "модель по умолчанию у провайдера".
 */
export async function getTaskModel(task: "roles" | "rag"): Promise<string | undefined> {
  const specific = await getSetting<string | undefined>(`ai.model.${task}`, undefined);
  if (specific?.trim()) return specific.trim();
  const { analysisModel } = await getAiConfig();
  return analysisModel?.trim() || undefined;
}

/** Произвольная настройка по ключу (с запасным значением) — для сервисов рассылки. */
export async function getSettingValue<T>(key: string, fallback: T): Promise<T> {
  return getSetting<T>(key, fallback);
}

/** Bitrix-ID РОПов для брифов по отложенным сделкам (настройка «briefs.ropBitrixUserIds»; через запятую или массив). */
export async function getBriefRopIds(): Promise<string[]> {
  const v = await getSetting<unknown>("briefs.ropBitrixUserIds", undefined);
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,\s;]+/) : [];
  return list.map((x) => String(x).trim()).filter((x) => /^\d+$/.test(x));
}

/** Промты брифа: свой текст из настроек, иначе стандартный. */
export async function getBriefPrompts(): Promise<{ search: string; brief: string }> {
  const [search, brief] = await Promise.all([
    getSetting<string | undefined>("ai.brief.promptSearch", undefined),
    getSetting<string | undefined>("ai.brief.promptBrief", undefined),
  ]);
  return {
    search: search?.trim() || BRIEF_SEARCH_PROMPT_DEFAULT,
    brief: brief?.trim() || BRIEF_COMPOSE_PROMPT_DEFAULT,
  };
}

/** Модели брифов (AI Gateway): `briefSearch` — поиск в интернете, `brief` — анализ CRM + сборка брифа. */
export async function getBriefModels(): Promise<{ search: string; brief: string }> {
  const [search, brief] = await Promise.all([
    getSetting<string | undefined>("ai.model.briefSearch", undefined),
    getSetting<string | undefined>("ai.model.brief", undefined),
  ]);
  const def = process.env.SELFHOSTED_LLM_MODEL?.trim() || "local";
  const s = search?.trim() || def;
  return { search: s, brief: brief?.trim() || s };
}

/**
 * Задачи разметки ролей и LLM-анализа звонка/сделки. Раньше при self-hosted
 * провайдере (GigaChat на отдельной VPS, CPU-инференс — минуты на задачу) эти
 * типы уходили на отдельный воркер (scripts/ai-worker), т.к. не укладывались
 * в 60с Vercel Hobby. VPS удалена (2026-10), self-hosted теперь означает
 * облачный OpenAI-совместимый шлюз (Timeweb AI Gateway и т.п.) — обычный
 * быстрый облачный API, как Yandex/Anthropic. Поэтому все типы задач снова
 * безусловно идут через Vercel — отдельный воркер не нужен.
 */
export const ANALYSIS_JOB_TYPES: AiJobType[] = ["call.roles", "call.analyze", "deal.analyze"];

export const VERCEL_JOB_TYPES: AiJobType[] = [
  "bitrix.sync",
  "call.ingest",
  "call.transcribe",
  "call.diarize",
  ...ANALYSIS_JOB_TYPES,
  "brief.scan",
  "brief.lead",
  "brief.deal",
  "notify.coach",
];
