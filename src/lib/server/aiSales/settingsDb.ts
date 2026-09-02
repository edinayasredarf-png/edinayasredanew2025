import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";

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
  "bitrix.auto_write",
  "bitrix.auto_create_tasks",
  "retention.transcript_days",
]);

/* ── Типизованные геттеры для сервисов (с фолбэком на env) ── */

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ value: unknown }>(`select value from ai_settings where key = $1`, [key]);
  return (rows[0]?.value as T) ?? fallback;
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
