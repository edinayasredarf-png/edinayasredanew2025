"use client";

import React, { useEffect, useState } from "react";
import { listPublications } from "@/lib/contentOsStore";
import { CONTENT_OS_CHANNELS, PUBLICATION_STATUSES, type ContentPublication, type PublicationStatus } from "@/lib/contentOsTypes";

const statusColor: Record<PublicationStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  scheduled: "bg-sky-50 text-sky-700",
  published: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-50 text-red-700",
};

export default function PublicationsTab() {
  const [items, setItems] = useState<ContentPublication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { listPublications().then(setItems).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Publications</h2>
        <p className="text-sm text-gray-500">
          История публикаций (§29 ТЗ). Пока без токенов каналов публикация отмечается вручную (внутри материала, кнопка «Отметить опубликованным»).
        </p>
      </div>
      {loading && <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>}
      {!loading && items.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">Публикаций пока нет.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase">
              <th className="pb-2">Канал</th><th className="pb-2">Статус</th><th className="pb-2">Запланировано</th><th className="pb-2">Опубликовано</th><th className="pb-2">Ссылка</th><th className="pb-2">Ретраи</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((p) => (
              <tr key={p.id}>
                <td className="py-2 pr-3">{CONTENT_OS_CHANNELS.find((c) => c.key === p.channel)?.icon} {CONTENT_OS_CHANNELS.find((c) => c.key === p.channel)?.label}</td>
                <td className="py-2 pr-3"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColor[p.status]}`}>{PUBLICATION_STATUSES.find((s) => s.key === p.status)?.label}</span></td>
                <td className="py-2 pr-3 text-gray-500">{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString("ru-RU") : "—"}</td>
                <td className="py-2 pr-3 text-gray-500">{p.published_at ? new Date(p.published_at).toLocaleString("ru-RU") : "—"}</td>
                <td className="py-2 pr-3">{p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="text-[#029cda] hover:underline">открыть</a> : "—"}</td>
                <td className="py-2 text-gray-500">{p.retry_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
