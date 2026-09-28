import "server-only";

import { getAllSettings } from "@/lib/server/aiSales/settingsDb";
import type { StageKey } from "@/lib/ai/dealStages";

/**
 * Ручные переопределения промта анализа по этапу воронки — правятся из
 * админки (AI Продажи → Промты → «Промты по этапам воронки»), хранятся в
 * ai_settings (ключ aiSales.stagePromptOverrides, whitelisted в
 * settingsDb.ts). Пусто/нет записи для этапа — используется стандартный
 * блок из src/lib/ai/prompts/dealStagePrompts.ts (getStagePromptBlock).
 */

const KEY = "aiSales.stagePromptOverrides";

export async function getStagePromptOverrides(): Promise<Partial<Record<StageKey, string>>> {
  const all = await getAllSettings();
  const v = all[KEY];
  return v && typeof v === "object" ? (v as Partial<Record<StageKey, string>>) : {};
}

/** Переопределённый промт для этапа, либо null (использовать стандартный). */
export async function getStagePromptOverride(key: StageKey): Promise<string | null> {
  const overrides = await getStagePromptOverrides();
  const v = overrides[key];
  return v && v.trim() ? v.trim() : null;
}
