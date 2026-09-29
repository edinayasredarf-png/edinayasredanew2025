"use client";

import React, { useCallback, useEffect, useState } from "react";
import { listItemsByChannel } from "@/lib/contentOsStore";
import { CONTENT_ITEM_STATUSES, CONTENT_OS_CHANNELS, SOCIAL_CHANNELS, type ContentItemStatus, type ContentItemWithCluster } from "@/lib/contentOsTypes";

const statusColor: Record<ContentItemStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  review: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  scheduled: "bg-sky-50 text-sky-700",
  published: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-50 text-red-700",
};

export default function SocialTab({ onOpenCluster }: { onOpenCluster: (clusterId: string) => void }) {
  const [items, setItems] = useState<ContentItemWithCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listItemsByChannel(SOCIAL_CHANNELS)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = filter === "all" ? items : items.filter((i) => i.channel === filter);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Social</h2>
        <p className="text-sm text-gray-500">Telegram, ВКонтакте, Дзен, MAX — все версии по соцканалам в одном месте.</p>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${filter === "all" ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-500"}`}>Все</button>
        {SOCIAL_CHANNELS.map((ch) => {
          const meta = CONTENT_OS_CHANNELS.find((c) => c.key === ch);
          return (
            <button key={ch} onClick={() => setFilter(ch)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${filter === ch ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-500"}`}>
              {meta?.icon} {meta?.label}
            </button>
          );
        })}
      </div>
      {loading && <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>}
      {!loading && visible.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">Материалов пока нет.</p>}
      <div className="space-y-2">
        {visible.map((it) => (
          <button key={it.id} onClick={() => onOpenCluster(it.cluster_id)} className="w-full text-left flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200">
            <span className="text-lg shrink-0">{CONTENT_OS_CHANNELS.find((c) => c.key === it.channel)?.icon}</span>
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
