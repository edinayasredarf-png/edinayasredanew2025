"use client";
import { dataFetch } from "@/lib/dataApi";

export interface AdBanner {
  id: string;
  image: string;
  href: string;
  alt: string;
  sort: number;
  created_at: number;
}

export async function listAds(): Promise<AdBanner[]> {
  return (await dataFetch("/ads")) as AdBanner[];
}

export async function upsertAd(item: AdBanner): Promise<void> {
  await dataFetch("/ads", { method: "POST", body: JSON.stringify(item) });
}

export async function deleteAd(id: string): Promise<void> {
  await dataFetch(`/ads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
}
