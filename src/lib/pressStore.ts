"use client";
import { dataFetch } from "@/lib/dataApi";

export interface PressItem {
  id: string;
  title: string;
  source_name: string;
  source_logo: string;
  link: string;
  published_at: number;
  created_at: number;
}

export async function listPress(): Promise<PressItem[]> {
  return (await dataFetch("/press")) as PressItem[];
}

export async function upsertPress(item: PressItem): Promise<void> {
  await dataFetch("/press", { method: "POST", body: JSON.stringify(item) });
}

export async function deletePress(id: string): Promise<void> {
  await dataFetch(`/press?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
