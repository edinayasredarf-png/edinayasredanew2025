"use client";

import React, { useEffect, useState } from "react";
import { getStats, type CfStats } from "@/lib/contentFactoryStore";
import { CF_PLAN_TYPES, CF_TOPIC_STATUSES, platformLabel, rubricLabel, type CfPlatform, type CfRubric } from "@/lib/contentFactoryTypes";

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
      <div className="w-32 text-xs text-gray-600 text-right shrink-0 truncate">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-8 text-xs text-gray-400 shrink-0">{value}</div>
    </div>
  );
}

export default function AnalyticsTab({ rubrics, platforms }: { rubrics: CfRubric[]; platforms: CfPlatform[] }) {
  const [stats, setStats] = useState<CfStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getStats().then(setStats).finally(() => setLoading(false)); }, []);

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>;
  if (!stats) return <p className="text-sm text-gray-400 py-8 text-center">Нет данных.</p>;

  const totalTopics = Object.values(stats.topicsByStatus).reduce((a, b) => a + b, 0);
  const totalPlan = Object.values(stats.planByStatus).reduce((a, b) => a + b, 0);
  const maxRubric = Math.max(1, ...stats.topicsByRubric.map((r) => r.n));
  const maxPlatform = Math.max(1, ...stats.planByPlatform.map((r) => r.n));
  const maxType = Math.max(1, ...Object.values(stats.planByType));

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Аналитика контента</h2>
        <p className="text-sm text-gray-500">
          Внутренняя статистика портфеля тем и контент-плана. Метрики охвата, просмотров и ER появятся после подключения API соцсетей.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Темы в портфеле" value={totalTopics} accent="#029cda" />
        <Kpi label="В плане публикаций" value={totalPlan} accent="#22c55e" />
        <Kpi label="Опубликовано" value={stats.planByStatus.published ?? 0} accent="#8b5cf6" />
        <Kpi label="Черновиков" value={stats.planByStatus.draft ?? 0} accent="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Темы по статусам</h3>
          <div className="space-y-2.5">
            {CF_TOPIC_STATUSES.map((s) => (
              <BarRow key={s.key} label={s.label} value={stats.topicsByStatus[s.key] ?? 0} max={Math.max(1, totalTopics)} color="#029cda" />
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Темы по рубрикам</h3>
          <div className="space-y-2.5">
            {stats.topicsByRubric.map((r) => (
              <BarRow key={r.rubric_id ?? "none"} label={rubricLabel(rubrics, r.rubric_id)} value={r.n} max={maxRubric} color="#8b5cf6" />
            ))}
            {stats.topicsByRubric.length === 0 && <p className="text-xs text-gray-400">Нет данных.</p>}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">План по платформам</h3>
          <div className="space-y-2.5">
            {stats.planByPlatform.map((r) => (
              <BarRow key={r.platform_id} label={platformLabel(platforms, r.platform_id)} value={r.n} max={maxPlatform} color="#22c55e" />
            ))}
            {stats.planByPlatform.length === 0 && <p className="text-xs text-gray-400">Нет данных.</p>}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">План по форматам</h3>
          <div className="space-y-2.5">
            {CF_PLAN_TYPES.map((t) => (
              <BarRow key={t.key} label={t.label} value={stats.planByType[t.key] ?? 0} max={maxType} color={t.color} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">🔥 Топ тем по популярности</h3>
          <div className="divide-y divide-gray-100">
            {stats.topTopics.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-800 truncate pr-3">{t.title}</span>
                <span className="text-gray-400 whitespace-nowrap text-xs">{t.popularity} · рел. {t.relevance}</span>
              </div>
            ))}
            {stats.topTopics.length === 0 && <p className="text-xs text-gray-400 py-2">Нет тем.</p>}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">⏱️ Ближайшие публикации</h3>
          <div className="divide-y divide-gray-100">
            {stats.upcoming.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-800 truncate pr-3">{p.title}</span>
                <span className="text-gray-400 whitespace-nowrap text-xs">{new Date(p.scheduled_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
            {stats.upcoming.length === 0 && <p className="text-xs text-gray-400 py-2">Публикаций не запланировано.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
