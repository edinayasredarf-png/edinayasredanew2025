"use client";

import { dataFetch } from "@/lib/dataApi";
import type {
  CfBrandSettings,
  CfPlanItem,
  CfPlanVersion,
  CfPlatform,
  CfQaChecklist,
  CfRubric,
  CfTopic,
} from "@/lib/contentFactoryTypes";

const base = "/content-factory";

/* ─────────── Рубрики ─────────── */
export const listRubrics = () => dataFetch(`${base}/rubrics`) as Promise<CfRubric[]>;
export const upsertRubric = (r: Partial<CfRubric>) =>
  dataFetch(`${base}/rubrics`, { method: "POST", body: JSON.stringify(r) }) as Promise<{ id: string }>;
export const reorderRubric = (id: string, direction: "up" | "down") =>
  dataFetch(`${base}/rubrics`, { method: "POST", body: JSON.stringify({ id, direction }) });
export const deleteRubric = (id: string) => dataFetch(`${base}/rubrics?id=${encodeURIComponent(id)}`, { method: "DELETE" });

/* ─────────── Темы ─────────── */
export const listTopics = (params: { status?: string; rubric_id?: string; q?: string } = {}) => {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.rubric_id) sp.set("rubric_id", params.rubric_id);
  if (params.q) sp.set("q", params.q);
  const qs = sp.toString();
  return dataFetch(`${base}/topics${qs ? `?${qs}` : ""}`) as Promise<CfTopic[]>;
};
export const upsertTopic = (t: Partial<CfTopic>) =>
  dataFetch(`${base}/topics`, { method: "POST", body: JSON.stringify(t) }) as Promise<{ id: string }>;
export const reorderTopic = (id: string, direction: "up" | "down") =>
  dataFetch(`${base}/topics`, { method: "POST", body: JSON.stringify({ id, direction }) });
export const deleteTopic = (id: string) => dataFetch(`${base}/topics?id=${encodeURIComponent(id)}`, { method: "DELETE" });

/* ─────────── Платформы ─────────── */
export const listPlatforms = () => dataFetch(`${base}/platforms`) as Promise<CfPlatform[]>;
export const upsertPlatform = (p: Partial<CfPlatform>) =>
  dataFetch(`${base}/platforms`, { method: "POST", body: JSON.stringify(p) }) as Promise<{ id: string }>;
export const deletePlatform = (id: string) => dataFetch(`${base}/platforms?id=${encodeURIComponent(id)}`, { method: "DELETE" });

/* ─────────── Бренд-настройки ─────────── */
export const getBrandSettings = () => dataFetch(`${base}/brand`) as Promise<CfBrandSettings>;
export const saveBrandSettings = (b: Partial<CfBrandSettings>) =>
  dataFetch(`${base}/brand`, { method: "POST", body: JSON.stringify(b) });

/* ─────────── Контент-план ─────────── */
export const listPlanItems = (params: { from?: number; to?: number } = {}) => {
  const sp = new URLSearchParams();
  if (params.from != null) sp.set("from", String(params.from));
  if (params.to != null) sp.set("to", String(params.to));
  const qs = sp.toString();
  return dataFetch(`${base}/plan${qs ? `?${qs}` : ""}`) as Promise<CfPlanItem[]>;
};
export const upsertPlanItem = (p: Partial<CfPlanItem>) =>
  dataFetch(`${base}/plan`, { method: "POST", body: JSON.stringify(p) }) as Promise<{ id: string }>;
export const getPlanItem = (id: string) => dataFetch(`${base}/plan/${encodeURIComponent(id)}`) as Promise<CfPlanItem>;
export const deletePlanItem = (id: string) => dataFetch(`${base}/plan?id=${encodeURIComponent(id)}`, { method: "DELETE" });

/* ─────────── Платформенные версии ─────────── */
export const listPlanVersions = (planId: string) =>
  dataFetch(`${base}/plan/versions?plan_id=${encodeURIComponent(planId)}`) as Promise<CfPlanVersion[]>;
export const upsertPlanVersion = (v: { plan_id: string; platform_id: string; body?: string; qa?: Partial<CfQaChecklist> }) =>
  dataFetch(`${base}/plan/versions`, { method: "POST", body: JSON.stringify(v) }) as Promise<{ id: string }>;
export const deletePlanVersion = (planId: string, platformId: string) =>
  dataFetch(`${base}/plan/versions?plan_id=${encodeURIComponent(planId)}&platform_id=${encodeURIComponent(platformId)}`, { method: "DELETE" });

/* ─────────── Генерация текста (Claude) ─────────── */
export interface GenerateParams {
  topicTitle: string;
  thesis?: string;
  sourceName?: string;
  sourceUrl?: string;
  useSource?: boolean;
  type?: "post" | "article" | "reel" | "digest";
  audience?: string;
  requirements?: string;
  emoji?: "auto" | "0" | "1" | "2" | "3";
  platformId: string;
}
export const generateContent = (p: GenerateParams) =>
  dataFetch(`${base}/generate`, { method: "POST", body: JSON.stringify(p) }) as Promise<{ body: string; hashtags: string[]; model: string }>;

/* ─────────── Аналитика ─────────── */
export interface CfStats {
  topicsByStatus: Record<string, number>;
  topicsByRubric: { rubric_id: string | null; n: number }[];
  planByStatus: Record<string, number>;
  planByPlatform: { platform_id: string; n: number }[];
  planByType: Record<string, number>;
  topTopics: CfTopic[];
  upcoming: CfPlanItem[];
}
export const getStats = () => dataFetch(`${base}/stats`) as Promise<CfStats>;
