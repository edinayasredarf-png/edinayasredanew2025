"use client";

import React, { useEffect, useState } from "react";
import { getStats, type ContentOsStats } from "@/lib/contentOsStore";
import { CONTENT_CLUSTER_STATUSES, CONTENT_ITEM_STATUSES, PUBLICATION_STATUSES } from "@/lib/contentOsTypes";

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

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-xs text-gray-600 text-right shrink-0 truncate">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-8 text-xs text-gray-400 shrink-0">{value}</div>
    </div>
  );
}

export default function AnalyticsTab() {
  const [stats, setStats] = useState<ContentOsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getStats().then(setStats).finally(() => setLoading(false)); }, []);

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>;
  if (!stats) return <p className="text-sm text-gray-400 py-8 text-center">Нет данных.</p>;

  const totalRuns = stats.runsByStatus.reduce((a, r) => a + r.n, 0);
  const localRuns = stats.runsByProvider.find((r) => r.provider === "local")?.n ?? 0;
  const cloudRuns = stats.runsByProvider.find((r) => r.provider === "anthropic")?.n ?? 0;
  const maxProvider = Math.max(1, localRuns, cloudRuns);
  const totalItems = Object.values(stats.itemsByStatus).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Аналитика</h2>
        <p className="text-sm text-gray-500">Использование ИИ (local/cloud, fallback) и статусы контента. Метрики охвата/публикаций — после Phase 12/13 (см. implementation-plan.md).</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="AI-вызовов всего" value={totalRuns} accent="#029cda" />
        <Kpi label="Через local (GigaChat)" value={localRuns} accent="#22c55e" />
        <Kpi label="Через облако (Claude)" value={cloudRuns} accent="#8b5cf6" />
        <Kpi label="Доля fallback" value={`${Math.round(stats.fallbackRate * 100)}%`} accent="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Провайдер</h3>
          <div className="space-y-2.5">
            <BarRow label="Local (GigaChat)" value={localRuns} max={maxProvider} color="#22c55e" />
            <BarRow label="Облако (Claude)" value={cloudRuns} max={maxProvider} color="#8b5cf6" />
          </div>
          {totalRuns === 0 && <p className="text-xs text-gray-400 mt-3">Вызовов ещё не было — сгенерируйте черновик во вкладке «Контент».</p>}
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Контент по статусам</h3>
          <div className="space-y-2.5">
            {CONTENT_ITEM_STATUSES.map((s) => (
              <BarRow key={s.key} label={s.label} value={stats.itemsByStatus[s.key] ?? 0} max={Math.max(1, totalItems)} color="#029cda" />
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Кластеры по статусам</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CONTENT_CLUSTER_STATUSES.map((s) => (
              <div key={s.key} className="bg-[#F6F7F9] rounded-xl p-3 text-center">
                <p className="text-xl font-semibold text-gray-900">{stats.clustersByStatus[s.key] ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Публикации по статусам</h3>
          <div className="grid grid-cols-2 gap-3">
            {PUBLICATION_STATUSES.map((s) => (
              <div key={s.key} className="bg-[#F6F7F9] rounded-xl p-3 text-center">
                <p className="text-xl font-semibold text-gray-900">{stats.publicationsByStatus[s.key] ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
