"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getResearchPack } from "@/lib/contentOsStore";
import type { ContentCluster } from "@/lib/contentOsTypes";

export default function ResearchTab({ clusters, onOpenCluster }: { clusters: ContentCluster[]; onOpenCluster: (clusterId: string) => void }) {
  const [summaries, setSummaries] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const entries = await Promise.all(clusters.map(async (c) => [c.id, (await getResearchPack(c.id))?.summary ?? null] as const));
      setSummaries(Object.fromEntries(entries));
    } finally {
      setLoading(false);
    }
  }, [clusters]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Research</h2>
        <p className="text-sm text-gray-500">
          Research pack по каждому кластеру (§22 ТЗ: search → sources → extract → verify → structure). Сбор источников и синтез — внутри кластера (кнопка «Открыть»).
        </p>
      </div>
      {loading && <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>}
      {!loading && clusters.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">Кластеров пока нет — создайте во вкладке Ideas.</p>}
      <div className="space-y-2">
        {clusters.map((c) => (
          <button key={c.id} onClick={() => onOpenCluster(c.id)} className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${summaries[c.id] ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {summaries[c.id] ? "Есть research pack" : "Нет research pack"}
              </span>
            </div>
            {summaries[c.id] && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{summaries[c.id]}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
