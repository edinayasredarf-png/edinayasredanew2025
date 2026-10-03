"use client";

import type {
  ContentBrandDocument,
  ContentBrief,
  ContentChannelProfile,
  ContentCluster,
  ContentCompany,
  ContentFactCheck,
  ContentItem,
  ContentItemVersion,
  ContentItemWithCluster,
  ContentOsChannel,
  ContentPublication,
  ContentQcCheck,
  ContentResearchPack,
  ContentResearchSource,
  ContentSeo,
  ContentSource,
  ContentSourceItem,
  ContentSourceItemStatus,
  ContentTopic,
  PublicationStatus,
  QcCheckType,
} from "@/lib/contentOsTypes";

// Не под /api/data — Content OS живёт под /api/content-os (отдельно от
// dataFetch-обёртки старых разделов).
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

/**
 * Активная компания — cookie, не параметр apiFetch (см.
 * src/lib/server/contentOsCompany.ts: apiFetch уже шлёт credentials:
 * "include", cookie едет автоматически на каждый запрос без правки всех
 * ~25 функций ниже и их вызовов в 13 вкладках).
 */
const CONTENT_OS_COMPANY_COOKIE = "content_os_company";

export function getActiveCompanyIdClient(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONTENT_OS_COMPANY_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

export function setActiveCompanyIdClient(id: string): void {
  document.cookie = `${CONTENT_OS_COMPANY_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`;
}

/* ─────────── Ideas (темы) ─────────── */
export const listTopics = (status?: string) => apiFetch(`/topics${status ? `?status=${status}` : ""}`) as Promise<ContentTopic[]>;
export const upsertTopic = (t: Partial<ContentTopic>) => apiFetch("/topics", { method: "POST", body: JSON.stringify(t) }) as Promise<{ id: string }>;
export const deleteTopic = (id: string) => apiFetch(`/topics?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const classifyTopic = (id: string) => apiFetch(`/topics/${encodeURIComponent(id)}/classify`, { method: "POST" }) as Promise<{ relevance: number; popularity: number; angle: string }>;

/* ─────────── Компании/бренды ─────────── */
export const listCompanies = (includeInactive = false) =>
  apiFetch(`/companies${includeInactive ? "?includeInactive=1" : ""}`) as Promise<ContentCompany[]>;
export const upsertCompany = (c: Partial<ContentCompany> & { name: string }) =>
  apiFetch("/companies", { method: "POST", body: JSON.stringify(c) }) as Promise<{ id: string }>;
export const deactivateCompany = (id: string) =>
  apiFetch(`/companies?id=${encodeURIComponent(id)}`, { method: "DELETE" }) as Promise<{ ok: true }>;

/* ─────────── Sources (собственная лента Content OS, без «Новостного радара») ─────────── */
export const listSources = () => apiFetch("/sources") as Promise<ContentSource[]>;
export const upsertSource = (s: Partial<ContentSource> & { name: string; type: ContentSource["type"]; url: string }) =>
  apiFetch("/sources", { method: "POST", body: JSON.stringify(s) }) as Promise<{ id: string }>;
export const deleteSource = (id: string) => apiFetch(`/sources?id=${encodeURIComponent(id)}`, { method: "DELETE" });

export const pollSources = () =>
  apiFetch("/sources/poll", { method: "POST" }) as Promise<{ sources: number; fetched: number; saved: number; errors: { source: string; error: string }[] }>;
export const listSourceItems = (opts: { status?: ContentSourceItemStatus; sourceId?: string } = {}) => {
  const sp = new URLSearchParams();
  if (opts.status) sp.set("status", opts.status);
  if (opts.sourceId) sp.set("sourceId", opts.sourceId);
  const qs = sp.toString();
  return apiFetch(`/sources/items${qs ? `?${qs}` : ""}`) as Promise<ContentSourceItem[]>;
};
export const convertSourceItemToTopic = (id: string) =>
  apiFetch(`/sources/items/${encodeURIComponent(id)}/topic`, { method: "POST" }) as Promise<{ id: string }>;
export const dismissSourceItem = (id: string) =>
  apiFetch(`/sources/items/${encodeURIComponent(id)}/dismiss`, { method: "POST" }) as Promise<{ ok: true }>;

/* ─────────── Кластеры / брифы ─────────── */
export const listClusters = () => apiFetch("/clusters") as Promise<ContentCluster[]>;
export const getCluster = (id: string) => apiFetch(`/clusters/${encodeURIComponent(id)}`) as Promise<ContentCluster>;
export const upsertCluster = (c: Partial<ContentCluster>) => apiFetch("/clusters", { method: "POST", body: JSON.stringify(c) }) as Promise<{ id: string }>;
export const deleteCluster = (id: string) => apiFetch(`/clusters?id=${encodeURIComponent(id)}`, { method: "DELETE" });

export const getBrief = (clusterId: string) => apiFetch(`/clusters/${encodeURIComponent(clusterId)}/brief`) as Promise<ContentBrief | null>;
export const saveBrief = (clusterId: string, b: { audience: string; angle: string; requirements: string; channels: ContentOsChannel[] }) =>
  apiFetch(`/clusters/${encodeURIComponent(clusterId)}/brief`, { method: "POST", body: JSON.stringify(b) }) as Promise<{ id: string }>;

export const listClusterItems = (clusterId: string) => apiFetch(`/clusters/${encodeURIComponent(clusterId)}/items`) as Promise<ContentItem[]>;

/* ─────────── Research (кластер) ─────────── */
export const getResearchPack = (clusterId: string) =>
  apiFetch(`/clusters/${encodeURIComponent(clusterId)}/research`) as Promise<(ContentResearchPack & { sources: ContentResearchSource[] }) | null>;
export const synthesizeResearch = (clusterId: string, sources: { title: string; url: string; extracted_text: string }[]) =>
  apiFetch(`/clusters/${encodeURIComponent(clusterId)}/research`, { method: "POST", body: JSON.stringify({ sources }) }) as Promise<{ id: string; summary: string }>;

/* ─────────── Контент-айтемы ─────────── */
export const upsertItem = (it: Partial<ContentItem> & { cluster_id: string; channel: ContentOsChannel }) =>
  apiFetch("/items", { method: "POST", body: JSON.stringify(it) }) as Promise<{ id: string }>;
export const deleteItem = (id: string) => apiFetch(`/items?id=${encodeURIComponent(id)}`, { method: "DELETE" });
export const listItemVersions = (itemId: string) => apiFetch(`/items/${encodeURIComponent(itemId)}/versions`) as Promise<ContentItemVersion[]>;
export const listItemsByChannel = (channels: ContentOsChannel[]) => apiFetch(`/items/by-channel?channel=${channels.join(",")}`) as Promise<ContentItemWithCluster[]>;

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

/* ─────────── QC-пайплайн ─────────── */
export const listQcChecks = (itemId: string) => apiFetch(`/items/${encodeURIComponent(itemId)}/qc`) as Promise<ContentQcCheck[]>;
export const runQcCheck = (itemId: string, checkType: QcCheckType) =>
  apiFetch(`/items/${encodeURIComponent(itemId)}/qc`, { method: "POST", body: JSON.stringify({ check_type: checkType }) }) as Promise<{ status: string; notes: string }>;

/* ─────────── SEO ─────────── */
export const getSeo = (itemId: string) => apiFetch(`/items/${encodeURIComponent(itemId)}/seo`) as Promise<ContentSeo | null>;
export const saveSeo = (itemId: string, s: Partial<ContentSeo>) =>
  apiFetch(`/items/${encodeURIComponent(itemId)}/seo`, { method: "POST", body: JSON.stringify(s) });

/* ─────────── Факт-чек ─────────── */
export const listFactChecks = (itemId: string) => apiFetch(`/items/${encodeURIComponent(itemId)}/fact-checks`) as Promise<ContentFactCheck[]>;
export const addFactCheck = (itemId: string, f: { claim: string; verdict: ContentFactCheck["verdict"]; source_url?: string }) =>
  apiFetch(`/items/${encodeURIComponent(itemId)}/fact-checks`, { method: "POST", body: JSON.stringify(f) }) as Promise<{ id: string }>;

/* ─────────── Content Plan ─────────── */
export const listPlan = (from?: number, to?: number) => {
  const sp = new URLSearchParams();
  if (from != null) sp.set("from", String(from));
  if (to != null) sp.set("to", String(to));
  const qs = sp.toString();
  return apiFetch(`/plan${qs ? `?${qs}` : ""}`) as Promise<ContentItemWithCluster[]>;
};

/* ─────────── Publications ─────────── */
export const listPublications = () => apiFetch("/publications") as Promise<ContentPublication[]>;
export const upsertPublication = (p: { content_item_id: string; channel: ContentOsChannel; status: PublicationStatus; url?: string; scheduled_at?: number | null; published_at?: number | null }) =>
  apiFetch("/publications", { method: "POST", body: JSON.stringify(p) }) as Promise<{ id: string }>;

/** Реальная публикация (сейчас только vk/telegram, см. src/lib/publishing). */
export const publishItem = (itemId: string, channel: ContentOsChannel) =>
  apiFetch(`/items/${itemId}/publish`, { method: "POST", body: JSON.stringify({ channel }) }) as Promise<{
    status: "published" | "failed"; url: string | null; externalId: string | null; error: string | null;
  }>;

/* ─────────── Каналы (Settings) ─────────── */
export const listChannels = () => apiFetch("/channels") as Promise<ContentChannelProfile[]>;
export const upsertChannel = (c: Partial<ContentChannelProfile> & { id: string }) =>
  apiFetch("/channels", { method: "POST", body: JSON.stringify(c) }) as Promise<{ ok: true }>;

/* ─────────── Бренд ─────────── */
export const listBrandDocuments = () => apiFetch("/brand") as Promise<ContentBrandDocument[]>;
export const upsertBrandDocument = (d: { id?: string; title: string; category: string; content: string }) =>
  apiFetch("/brand", { method: "POST", body: JSON.stringify(d) }) as Promise<{ id: string }>;
export const deleteBrandDocument = (id: string) => apiFetch(`/brand?id=${encodeURIComponent(id)}`, { method: "DELETE" });

/* ─────────── Статистика (Dashboard/Analytics) ─────────── */
export interface ContentOsStats {
  runsByProvider: { provider: string; n: number }[];
  runsByStatus: { status: string; n: number }[];
  fallbackRate: number;
  itemsByStatus: Record<string, number>;
  clustersByStatus: Record<string, number>;
  publicationsByStatus: Record<string, number>;
  sourcesActive: number;
  upcomingScheduled: ContentItemWithCluster[];
}
export const getStats = () => apiFetch("/stats") as Promise<ContentOsStats>;
