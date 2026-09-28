import "server-only";

import { bitrixCall, bitrixConfigured, bxStr } from "@/lib/server/bitrix/client";
import { getAllSettings, setSetting } from "@/lib/server/aiSales/settingsDb";
import {
  matchStageInPipeline,
  classifyDealCategoryPipeline,
  pipelineOfStageKey,
  BITRIX_DEAL_STAGE_MAP,
  BITRIX_LEAD_STATUS_MAP,
  STAGE_LABEL,
  type StageKey,
  type PipelineKey,
} from "@/lib/ai/dealStages";

/**
 * Справочник стадий Bitrix — STAGE_ID сделки / STATUS_ID лида →
 * человекочитаемое название и канонический ключ одной из ТРЁХ воронок
 * «Единой среды» (см. src/lib/ai/dealStages.ts): лид, «Отдел продаж»,
 * «Обслуживание сервиса». Bitrix отдаёт в crm.deal.list/crm.lead.list
 * только код стадии (часто нечитаемый "C4:UC_XXXX" для кастомной воронки) —
 * без названия сопоставить его с нашей воронкой невозможно. Поэтому
 * справочник тянем отдельно (crm.dealcategory.*, crm.status.list) и кэшируем
 * в ai_settings — во время самого анализа звонка Bitrix уже не дёргаем
 * (см. analysisService.ts).
 *
 * Основной источник истины для каждого STAGE_ID/STATUS_ID —
 * BITRIX_DEAL_STAGE_MAP/BITRIX_LEAD_STATUS_MAP (src/lib/ai/dealStages.ts,
 * точные коды получены от РОП). Автосопоставление по названию
 * (classifyDealCategoryPipeline/matchStageInPipeline) — только резерв для
 * стадий, которых там ещё нет (например, если в Bitrix позже добавят
 * новую категорию/стадию) — при необходимости можно переопределить вручную
 * через aiSales.stageOverrides.
 *
 * Обновление: автоматически после полной синхронизации сделок/лидов
 * (bitrixSyncService.ts), либо вручную — кнопка в разделе «Настройки».
 */

const DICTIONARY_KEY = "aiSales.stageDictionary";
// Ручные переопределения на случай, если автосопоставление по названию не
// сработало. Ключи вида "deal:<STAGE_ID>" / "lead:<STATUS_ID>" (namespaced,
// т.к. дефолтные коды Bitrix вроде "NEW" могут совпадать у лида и сделки).
// Правится напрямую через PUT /api/ai-sales/settings (ключ в EDITABLE_KEYS).
const OVERRIDES_KEY = "aiSales.stageOverrides";

export interface StageDictionaryEntry {
  name: string;
  categoryId: string;
  pipeline: PipelineKey | "unknown";
  canonicalKey: StageKey;
}
export interface StageDictionary {
  updatedAt: string;
  dealStages: Record<string, StageDictionaryEntry>; // ключ — STAGE_ID
  leadStatuses: Record<string, StageDictionaryEntry>; // ключ — STATUS_ID
  categoryPipeline: Record<string, PipelineKey | "unknown">; // ключ — CATEGORY_ID
}

interface BxDealCategory {
  ID?: string | number;
}
interface BxStatusEntry {
  STATUS_ID?: string;
  NAME?: string;
}

/** Забрать у Bitrix все стадии всех воронок сделок (дефолтная + кастомные), сгруппированные по категории. */
async function fetchDealCategoriesWithStages(): Promise<
  Array<{ categoryId: string; stages: Array<{ stageId: string; name: string }> }>
> {
  const categories = await bitrixCall<BxDealCategory[]>("crm.dealcategory.list", {});
  const categoryIds = [
    "0",
    ...(Array.isArray(categories.result) ? categories.result : []).map((c) => bxStr(c.ID)).filter(Boolean),
  ];

  const out: Array<{ categoryId: string; stages: Array<{ stageId: string; name: string }> }> = [];
  for (const categoryId of Array.from(new Set(categoryIds))) {
    try {
      const { result } = await bitrixCall<BxStatusEntry[]>("crm.dealcategory.stage.list", { id: categoryId });
      const stages = (Array.isArray(result) ? result : [])
        .map((s) => ({ stageId: bxStr(s.STATUS_ID), name: bxStr(s.NAME) }))
        .filter((s) => s.stageId);
      out.push({ categoryId, stages });
    } catch {
      // Категория могла быть удалена между list и stage.list — пропускаем.
    }
  }
  return out;
}

/** Статусы Bitrix Lead (entityId="STATUS" — единая воронка лида, без категорий). */
async function fetchLeadStatuses(): Promise<Array<{ statusId: string; name: string }>> {
  const { result } = await bitrixCall<BxStatusEntry[]>("crm.status.list", {
    filter: { ENTITY_ID: "STATUS" },
  });
  return (Array.isArray(result) ? result : [])
    .map((s) => ({ statusId: bxStr(s.STATUS_ID), name: bxStr(s.NAME) }))
    .filter((s) => s.statusId);
}

/** Пересобрать и сохранить справочник стадий (сделки + лиды) в ai_settings. */
export async function refreshDealStageDictionary(): Promise<StageDictionary> {
  if (!bitrixConfigured()) {
    throw new Error("BITRIX24_WEBHOOK_URL не задан — справочник стадий недоступен");
  }

  const categories = await fetchDealCategoriesWithStages();
  const dealStages: Record<string, StageDictionaryEntry> = {};
  const categoryPipeline: Record<string, PipelineKey | "unknown"> = {};
  for (const cat of categories) {
    // Резервная классификация категории по названиям — только для стадий
    // без точного кода в BITRIX_DEAL_STAGE_MAP (см. ниже).
    const fallbackPipeline = classifyDealCategoryPipeline(cat.stages.map((s) => s.name));
    let knownPipeline: PipelineKey | null = null;
    for (const s of cat.stages) {
      const hardcoded = BITRIX_DEAL_STAGE_MAP[s.stageId];
      if (hardcoded) {
        const pipeline = pipelineOfStageKey(hardcoded);
        if (pipeline !== "unknown") knownPipeline = pipeline;
        dealStages[s.stageId] = { name: s.name, categoryId: cat.categoryId, pipeline, canonicalKey: hardcoded };
      } else {
        dealStages[s.stageId] = {
          name: s.name,
          categoryId: cat.categoryId,
          pipeline: fallbackPipeline,
          canonicalKey: fallbackPipeline === "unknown" ? "unknown" : matchStageInPipeline(fallbackPipeline, s.name),
        };
      }
    }
    // Воронка категории для отображения — по точным кодам, если хоть один
    // известен в этой категории, иначе по эвристике названий.
    categoryPipeline[cat.categoryId] = knownPipeline ?? fallbackPipeline;
  }

  const leadStatusesRaw = await fetchLeadStatuses();
  const leadStatuses: Record<string, StageDictionaryEntry> = {};
  for (const s of leadStatusesRaw) {
    const hardcoded = BITRIX_LEAD_STATUS_MAP[s.statusId];
    leadStatuses[s.statusId] = {
      name: s.name,
      categoryId: "",
      pipeline: "lead",
      canonicalKey: hardcoded ?? matchStageInPipeline("lead", s.name),
    };
  }

  const dict: StageDictionary = { updatedAt: new Date().toISOString(), dealStages, leadStatuses, categoryPipeline };
  await setSetting(DICTIONARY_KEY, dict);
  return dict;
}

/** Прочитать закэшированный справочник (без обращения к Bitrix). */
export async function getDealStageDictionary(): Promise<StageDictionary | null> {
  const all = await getAllSettings();
  const v = all[DICTIONARY_KEY];
  return v && typeof v === "object" ? (v as StageDictionary) : null;
}

async function getStageOverrides(): Promise<Record<string, StageKey>> {
  const all = await getAllSettings();
  const v = all[OVERRIDES_KEY];
  return v && typeof v === "object" ? (v as Record<string, StageKey>) : {};
}

export interface ResolvedStage {
  id: string | null; // STAGE_ID или STATUS_ID
  key: StageKey;
  pipeline: PipelineKey | "unknown";
  label: string | null; // название стадии в Bitrix (как есть, для отображения)
  matched: boolean; // false — не найден в справочнике/не сопоставлен
}

const UNRESOLVED = (id: string | null): ResolvedStage => ({ id, key: "unknown", pipeline: "unknown", label: null, matched: false });

/**
 * Определить канонический этап (лид/«Отдел продаж»/«Обслуживание сервиса»/
 * «Управление проектами») по сырому STAGE_ID сделки. Не обращается к Bitrix
 * — только к точным кодам (BITRIX_DEAL_STAGE_MAP) и закэшированным данным
 * (быстро и безопасно дёргать на каждый анализ звонка).
 * Порядок: ручное переопределение → точный код → справочник (имя из
 * Bitrix, резерв для стадий, которых нет в точной карте) → неизвестно.
 */
export async function resolveDealStage(stageId: string | null | undefined): Promise<ResolvedStage> {
  if (!stageId) return UNRESOLVED(null);
  const [overrides, dict] = await Promise.all([getStageOverrides(), getDealStageDictionary()]);
  const label = dict?.dealStages[stageId]?.name ?? null;

  const override = overrides[`deal:${stageId}`];
  if (override) {
    return { id: stageId, key: override, pipeline: pipelineOfStageKey(override), label: label ?? STAGE_LABEL[override] ?? null, matched: true };
  }
  const hardcoded = BITRIX_DEAL_STAGE_MAP[stageId];
  if (hardcoded) {
    return { id: stageId, key: hardcoded, pipeline: pipelineOfStageKey(hardcoded), label: label ?? STAGE_LABEL[hardcoded] ?? null, matched: true };
  }
  const entry = dict?.dealStages[stageId];
  if (entry) {
    return { id: stageId, key: entry.canonicalKey, pipeline: entry.pipeline, label: entry.name, matched: entry.canonicalKey !== "unknown" };
  }
  return UNRESOLVED(stageId);
}

/** Определить канонический этап воронки ЛИДА по сырому STATUS_ID лида. Тот же порядок приоритетов, что и resolveDealStage. */
export async function resolveLeadStage(statusId: string | null | undefined): Promise<ResolvedStage> {
  if (!statusId) return UNRESOLVED(null);
  const [overrides, dict] = await Promise.all([getStageOverrides(), getDealStageDictionary()]);
  const label = dict?.leadStatuses[statusId]?.name ?? null;

  const override = overrides[`lead:${statusId}`];
  if (override) {
    return { id: statusId, key: override, pipeline: "lead", label: label ?? STAGE_LABEL[override] ?? null, matched: true };
  }
  const hardcoded = BITRIX_LEAD_STATUS_MAP[statusId];
  if (hardcoded) {
    return { id: statusId, key: hardcoded, pipeline: "lead", label: label ?? STAGE_LABEL[hardcoded] ?? null, matched: true };
  }
  const entry = dict?.leadStatuses[statusId];
  if (entry) {
    return { id: statusId, key: entry.canonicalKey, pipeline: "lead", label: entry.name, matched: entry.canonicalKey !== "unknown" };
  }
  return UNRESOLVED(statusId);
}
