"use client";

import type {
  ContentBrandDocument,
  ContentBrief,
  ContentChannelProfile,
  ContentCluster,
  ContentItem,
  ContentItemVersion,
  ContentOsChannel,
  ContentTopic,
} from "@/lib/contentOsTypes";

// Не под /api/data — Content OS живёт под /api/content-os (отдельно от
// dataFetch-обёртки старого контент-завода/press/ads).
async function apiFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(`/api/content-os${path}`, { ...init, headers, credentials: "include" });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { const j = JSON.parse(text) as { error?: string }; if (j?.error) msg = j.error; } catch { /* raw */ }
    throw new Error(msg || res.statusText);
  }
  if (!text) return null;
  return JSON.parse(text) as unknown;
}

/* ─────────── Темы ─────────── */
export const listTopics = (status?: string) => apiFetch(`/topics${status ? `?status=${status}` : ""}`) as Promise<ContentTopic[]>;
export const upsertTopic = (t: Partial<ContentTopic>) => apiFetch("/topics", { method: "POST", body: JSON.stringify(t) }) as Promise<{ id: string }>;
export const deleteTopic = (id: string) => apiFetch(`/topics?id=${encodeURIComponent(id)}`, { method: "DELETE" });

/* ─────────── Кластеры ─────────── */
export const listClusters = () => apiFetch("/clusters") as Promise<ContentCluster[]>;
export const upsertCluster = (c: Partial<ContentCluster>) => apiFetch("/clusters", { method: "POST", body: JSON.stringify(c) }) as Promise<{ id: string }>;
export const deleteCluster = (id: string) => apiFetch(`/clusters?id=${encodeURIComponent(id)}`, { method: "DELETE" });

export const getBrief = (clusterId: string) => apiFetch(`/clusters/${encodeURIComponent(clusterId)}/brief`) as Promise<ContentBrief | null>;
export const saveBrief = (clusterId: string, b: { audience: string; angle: string; requirements: string; channels: ContentOsChannel[] }) =>
  apiFetch(`/clusters/${encodeURIComponent(clusterId)}/brief`, { method: "POST", body: JSON.stringify(b) }) as Promise<{ id: string }>;

export const listClusterItems = (clusterId: string) => apiFetch(`/clusters/${encodeURIComponent(clusterId)}/items`) as Promise<ContentItem[]>;

/* ─────────── Контент-айтемы ─────────── */
export const upsertItem = (it: Partial<ContentItem> & { cluster_id: string; channel: ContentOsChannel }) =>
  apiFetch("/items", { method: "POST", body: JSON.stringify(it) }) as Promise<{ id: string }>;
export const deleteItem = (id: string) => apiFetch(`/items?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const listItemVersions = (itemId: string) => apiFetch(`/items/${encodeURIComponent(itemId)}/versions`) as Promise<ContentItemVersion[]>;

export interface GenerateDraftParams {
  clusterId: string;
  channel: ContentOsChannel;
  topicTitle: string;
  thesis?: string;
  audience: string;
  angle: string;
  requirements?: string;
  contentItemId?: string;
}
export const generateDraft = (p: GenerateDraftParams) =>
  apiFetch("/items/generate", { method: "POST", body: JSON.stringify(p) }) as Promise<{ title: string; body: string; model: string }>;

/* ─────────── Каналы ─────────── */
export const listChannels = () => apiFetch("/channels") as Promise<ContentChannelProfile[]>;
export const upsertChannel = (c: Partial<ContentChannelProfile> & { id: string }) =>
  apiFetch("/channels", { method: "POST", body: JSON.stringify(c) }) as Promise<{ ok: true }>;

/* ─────────── Бренд ─────────── */
export const listBrandDocuments = () => apiFetch("/brand") as Promise<ContentBrandDocument[]>;
export const upsertBrandDocument = (d: { id?: string; title: string; category: string; content: string }) =>
  apiFetch("/brand", { method: "POST", body: JSON.stringify(d) }) as Promise<{ id: string }>;
export const deleteBrandDocument = (id: string) => apiFetch(`/brand?id=${encodeURIComponent(id)}`, { method: "DELETE" });

/* ─────────── Статистика ─────────── */
export interface ContentOsStats {
  runsByProvider: { provider: string; n: number }[];
  runsByStatus: { status: string; n: number }[];
  fallbackRate: number;
  itemsByStatus: Record<string, number>;
  clustersByStatus: Record<string, number>;
}
export const getStats = () => apiFetch("/stats") as Promise<ContentOsStats>;
