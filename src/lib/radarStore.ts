"use client";

import { dataFetch } from "@/lib/dataApi";
import type { RadarItem, RadarStatus, RadarTrigger } from "@/lib/radarTypes";

export async function listTriggers(): Promise<RadarTrigger[]> {
  return (await dataFetch("/radar/triggers")) as RadarTrigger[];
}

export async function upsertTrigger(t: Partial<RadarTrigger>): Promise<{ id: string }> {
  return (await dataFetch("/radar/triggers", {
    method: "POST",
    body: JSON.stringify(t),
  })) as { id: string };
}

export async function deleteTrigger(id: string): Promise<void> {
  await dataFetch(`/radar/triggers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function listItems(
  params: { category?: string; status?: string; q?: string } = {}
): Promise<RadarItem[]> {
  const sp = new URLSearchParams();
  if (params.category && params.category !== "all") sp.set("category", params.category);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  const qs = sp.toString();
  return (await dataFetch(`/radar/items${qs ? `?${qs}` : ""}`)) as RadarItem[];
}

export async function setItemStatus(id: string, status: RadarStatus): Promise<void> {
  await dataFetch("/radar/items", {
    method: "POST",
    body: JSON.stringify({ id, status }),
  });
}

export async function deleteItem(id: string): Promise<void> {
  await dataFetch(`/radar/items?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}

export interface RadarRefreshResult {
  triggers: number;
  fetched: number;
  saved: number;
  errors: { trigger: string; error: string }[];
}

export async function refreshRadar(): Promise<RadarRefreshResult> {
  return (await dataFetch("/radar/refresh", { method: "POST" })) as RadarRefreshResult;
}
