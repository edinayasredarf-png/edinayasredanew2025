"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getSeo, listItemsByChannel } from "@/lib/contentOsStore";
import type { ContentItemWithCluster, ContentSeo } from "@/lib/contentOsTypes";

export default function SeoTab({ onOpenCluster }: { onOpenCluster: (clusterId: string) => void }) {
  const [items, setItems] = useState<ContentItemWithCluster[]>([]);
  const [seoByItem, setSeoByItem] = useState<Record<string, ContentSeo | null>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const articles = await listItemsByChannel(["article"]);
      setItems(articles);
      const entries = await Promise.all(articles.map(async (a) => [a.id, await getSeo(a.id)] as const));
      setSeoByItem(Object.fromEntries(entries));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const completeness = (seo: ContentSeo | null | undefined) => {
    if (!seo) return 0;
    const fields = [seo.primary_keyword, seo.meta_title, seo.meta_description, seo.h1, seo.slug];
    return Math.round((fields.filter((f) => f && f.trim()).length / fields.length) * 100);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">SEO</h2>
        <p className="text-sm text-gray-500">Заполненность SEO-полей по статьям. Редактирование — внутри материала (кнопка «Открыть»).</p>
      </div>
      {loading && <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>}
      {!loading && items.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">Статей пока нет.</p>}
      <div className="space-y-2">
        {items.map((it) => {
          const seo = seoByItem[it.id];
          const pct = completeness(seo);
          return (
            <button key={it.id} onClick={() => onOpenCluster(it.cluster_id)} className="w-full text-left flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{it.title || it.cluster_title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{seo?.primary_keyword ? `Keyword: ${seo.primary_keyword}` : "Ключевое слово не задано"}</p>
              </div>
              <div className="w-24 shrink-0">
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[#029cda]" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-right">{pct}%</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
