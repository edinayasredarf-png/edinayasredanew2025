"use client";

import React, { useEffect, useState } from "react";
import { getStats, type ContentOsStats } from "@/lib/contentOsStore";
import { CONTENT_ITEM_STATUSES, CONTENT_OS_CHANNELS } from "@/lib/contentOsTypes";

function Kpi({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-[#F6F7F9] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent || "#029cda" }} />
        <p className="text-sm text-gray-600">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function DashboardTab({ onOpenCluster }: { onOpenCluster: (clusterId: string) => void }) {
  const [stats, setStats] = useState<ContentOsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getStats().then(setStats).finally(() => setLoading(false)); }, []);

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>;
  if (!stats) return <p className="text-sm text-gray-400 py-8 text-center">Нет данных.</p>;

  const totalItems = Object.values(stats.itemsByStatus).reduce((a, b) => a + b, 0);
  const published = stats.itemsByStatus.published ?? 0;
  const inReview = stats.itemsByStatus.review ?? 0;
  const totalRuns = stats.runsByStatus.reduce((a, r) => a + r.n, 0);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">Общая сводка по Content OS.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Материалов всего" value={totalItems} accent="#029cda" />
        <Kpi label="Опубликовано" value={published} accent="#22c55e" />
        <Kpi label="На проверке" value={inReview} accent="#f59e0b" />
        <Kpi label="Активных источников" value={stats.sourcesActive} accent="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">⏱️ Ближайшие публикации</h3>
          <div className="divide-y divide-gray-100">
            {stats.upcomingScheduled.length === 0 && <p className="text-xs text-gray-400 py-2">Ничего не запланировано.</p>}
            {stats.upcomingScheduled.map((it) => (
              <button key={it.id} onClick={() => onOpenCluster(it.cluster_id)} className="w-full text-left flex items-center justify-between py-2 text-sm hover:bg-gray-50 rounded-lg px-1">
                <span className="text-gray-800 truncate pr-3">{CONTENT_OS_CHANNELS.find((c) => c.key === it.channel)?.icon} {it.title || it.cluster_title}</span>
                <span className="text-gray-400 whitespace-nowrap text-xs">{it.scheduled_at ? new Date(it.scheduled_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">🤖 AI Gateway</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Вызовов всего</span><span className="font-medium text-gray-900">{totalRuns}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Через local (GigaChat)</span><span className="font-medium text-gray-900">{stats.runsByProvider.find((r) => r.provider === "local")?.n ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Через облако (Claude)</span><span className="font-medium text-gray-900">{stats.runsByProvider.find((r) => r.provider === "anthropic")?.n ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Доля fallback</span><span className="font-medium text-gray-900">{Math.round(stats.fallbackRate * 100)}%</span></div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">Подробнее — вкладка Analytics.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Материалы по статусам</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CONTENT_ITEM_STATUSES.map((s) => (
            <div key={s.key} className="bg-[#F6F7F9] rounded-xl p-3 text-center">
              <p className="text-xl font-semibold text-gray-900">{stats.itemsByStatus[s.key] ?? 0}</p>
              <p className="text-[11px] text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
