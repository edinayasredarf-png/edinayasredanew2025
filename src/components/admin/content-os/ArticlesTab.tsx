"use client";

import React, { useCallback, useEffect, useState } from "react";
import { listItemsByChannel } from "@/lib/contentOsStore";
import { CONTENT_ITEM_STATUSES, type ContentItemStatus, type ContentItemWithCluster } from "@/lib/contentOsTypes";

const statusColor: Record<ContentItemStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  review: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  scheduled: "bg-sky-50 text-sky-700",
  published: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-50 text-red-700",
};

export default function ArticlesTab({ onOpenCluster }: { onOpenCluster: (clusterId: string) => void }) {
  const [items, setItems] = useState<ContentItemWithCluster[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listItemsByChannel(["article"])); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Articles</h2>
        <p className="text-sm text-gray-500">Материалы для сайта (channel=article). SEO-параметры — во вкладке SEO или внутри материала.</p>
      </div>
      {loading && <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>}
      {!loading && items.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">Статей пока нет — создайте кластер во вкладке Ideas и выберите канал «Статья».</p>}
      <div className="space-y-2">
        {items.map((it) => (
          <button key={it.id} onClick={() => onOpenCluster(it.cluster_id)} className="w-full text-left flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{it.title || it.cluster_title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{new Date(it.updated_at).toLocaleDateString("ru-RU")}</p>
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor[it.status]}`}>{CONTENT_ITEM_STATUSES.find((s) => s.key === it.status)?.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
