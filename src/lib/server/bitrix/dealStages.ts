import "server-only";

import { bitrixCall, bitrixConfigured, bxStr } from "@/lib/server/bitrix/client";
import { getAllSettings, setSetting } from "@/lib/server/aiSales/settingsDb";
import { matchStageByName, type DealStageKey } from "@/lib/ai/dealStages";

/**
 * Справочник стадий сделки Bitrix (STAGE_ID → человекочитаемое название и
 * канонический ключ воронки «Единой среды»). Bitrix отдаёт в crm.deal.list
 * только код стадии (часто "C2:UC_XXXX" для кастомной воронки) — без
 * названия его невозможно сопоставить с воронкой РОП. Поэтому справочник
 * тянем отдельно (crm.dealcategory.*) и кэшируем в ai_settings — во время
 * самого анализа звонка Bitrix уже не дёргаем (см. analysisService.ts).
 *
 * Обновление: автоматически после полной синхронизации сделок
 * (bitrixSyncService.ts), либо вручную — кнопка в разделе «Настройки».
 */

const DICTIONARY_KEY = "aiSales.stageDictionary";
// Ручные переопределения на случай, если автосопоставление по названию не
// сработало (нестандартная формулировка стадии в Bitrix). Формат:
// { "C2:UC_XXXX": "deferred_demand" }. Правится напрямую через
// PUT /api/ai-sales/settings (ключ в EDITABLE_KEYS).
const OVERRIDES_KEY = "aiSales.stageOverrides";

export interface StageDictionaryEntry {
  name: string;
  categoryId: string;
  canonicalKey: DealStageKey;
}
export interface StageDictionary {
  updatedAt: string;
  stages: Record<string, StageDictionaryEntry>;
}

interface BxDealCategory {
  ID?: string | number;
}
interface BxDealCategoryStage {
  STATUS_ID?: string;
  NAME?: string;
}

/** Забрать у Bitrix все стадии всех воронок сделок (дефолтная + кастомные). */
async function fetchStagesFromBitrix(): Promise<Array<{ stageId: string; name: string; categoryId: string }>> {
  const out: Array<{ stageId: string; name: string; categoryId: string }> = [];

  // Дефолтная воронка (категория 0) + все дополнительные категории.
  const categories = await bitrixCall<BxDealCategory[]>("crm.dealcategory.list", {});
  const categoryIds = ["0", ...(Array.isArray(categories.result) ? categories.result : []).map((c) => bxStr(c.ID)).filter(Boolean)];

  for (const categoryId of Array.from(new Set(categoryIds))) {
    try {
      const { result } = await bitrixCall<BxDealCategoryStage[]>("crm.dealcategory.stage.list", { id: categoryId });
      for (const s of Array.isArray(result) ? result : []) {
        const stageId = bxStr(s.STATUS_ID);
        if (!stageId) continue;
        out.push({ stageId, name: bxStr(s.NAME), categoryId });
      }
    } catch {
      // Категория могла быть удалена между list и stage.list — пропускаем.
    }
  }
  return out;
}

/** Пересобрать и сохранить справочник стадий в ai_settings. */
export async function refreshDealStageDictionary(): Promise<StageDictionary> {
  if (!bitrixConfigured()) {
    throw new Error("BITRIX24_WEBHOOK_URL не задан — справочник стадий недоступен");
  }
  const raw = await fetchStagesFromBitrix();
  const stages: Record<string, StageDictionaryEntry> = {};
  for (const r of raw) {
    stages[r.stageId] = { name: r.name, categoryId: r.categoryId, canonicalKey: matchStageByName(r.name) };
  }
  const dict: StageDictionary = { updatedAt: new Date().toISOString(), stages };
  await setSetting(DICTIONARY_KEY, dict);
  return dict;
}

/** Прочитать закэшированный справочник (без обращения к Bitrix). */
export async function getDealStageDictionary(): Promise<StageDictionary | null> {
  const all = await getAllSettings();
  const v = all[DICTIONARY_KEY];
  return v && typeof v === "object" ? (v as StageDictionary) : null;
}

async function getStageOverrides(): Promise<Record<string, DealStageKey>> {
  const all = await getAllSettings();
  const v = all[OVERRIDES_KEY];
  return v && typeof v === "object" ? (v as Record<string, DealStageKey>) : {};
}

export interface ResolvedDealStage {
  stageId: string | null;
  key: DealStageKey;
  label: string | null; // название стадии в Bitrix (как есть, для отображения)
  matched: boolean; // false — STAGE_ID не найден в справочнике/не сопоставлен
}

/**
 * Определить канонический этап воронки по сырому STAGE_ID сделки.
 * Порядок: ручное переопределение → справочник (имя из Bitrix) → неизвестно.
 * Не обращается к Bitrix — только к закэшированным данным (быстро, безопасно
 * дёргать на каждый анализ звонка).
 */
export async function resolveDealStage(stageId: string | null | undefined): Promise<ResolvedDealStage> {
  if (!stageId) return { stageId: null, key: "unknown", label: null, matched: false };

  const [overrides, dict] = await Promise.all([getStageOverrides(), getDealStageDictionary()]);

  if (overrides[stageId]) {
    return { stageId, key: overrides[stageId], label: dict?.stages[stageId]?.name ?? null, matched: true };
  }
  const entry = dict?.stages[stageId];
  if (entry) {
    return { stageId, key: entry.canonicalKey, label: entry.name, matched: entry.canonicalKey !== "unknown" };
  }
  // Справочник ещё не обновлялся или STAGE_ID в нём отсутствует — последняя
  // попытка сопоставить хотя бы по самому коду (обычно бесполезно для
  // кастомных "C2:UC_..." кодов, но бесплатно для стандартных "NEW"/"WON" и т.п.).
  return { stageId, key: matchStageByName(stageId), label: null, matched: false };
}
