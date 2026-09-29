"use client";

import React, { useEffect, useState } from "react";
import ChannelsTab from "./ChannelsTab";
import { CONTENT_OS_TASK_LABELS, type ContentChannelProfile, type ContentOsTask } from "@/lib/contentOsTypes";

interface RoutingInfo {
  localConfigured: boolean;
  routes: Record<ContentOsTask, { provider: "local" | "anthropic"; model?: string; fallback: "local" | "anthropic" }>;
}

export default function SettingsTab({ channels, reloadChannels }: { channels: ContentChannelProfile[]; reloadChannels: () => Promise<void> }) {
  const [routing, setRouting] = useState<RoutingInfo | null>(null);

  useEffect(() => {
    fetch("/api/content-os/settings/routing", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setRouting)
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">Профили каналов и AI-роутинг (§73-74 ТЗ).</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">🧭 AI Routing</h3>
          {routing && (
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${routing.localConfigured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              Local {routing.localConfigured ? "настроен" : "не настроен (SELFHOSTED_LLM_URL)"}
            </span>
          )}
        </div>
        {!routing && <p className="text-xs text-gray-400">Загрузка...</p>}
        {routing && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] text-gray-400 uppercase">
                  <th className="pb-2">Задача</th><th className="pb-2">Провайдер</th><th className="pb-2">Fallback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(routing.routes).map(([task, r]) => (
                  <tr key={task}>
                    <td className="py-1.5 pr-3 text-gray-700">{CONTENT_OS_TASK_LABELS[task as ContentOsTask]}</td>
                    <td className="py-1.5 pr-3">
                      <span className={`px-1.5 py-0.5 rounded-full ${r.provider === "local" ? "bg-green-50 text-green-700" : "bg-purple-50 text-purple-700"}`}>
                        {r.provider === "local" ? "GigaChat (local)" : "Claude (облако)"}
                      </span>
                    </td>
                    <td className="py-1.5 text-gray-500">{r.fallback === "local" ? "GigaChat" : "Claude"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-3">Роутинг задаётся в src/lib/ai/router.ts (не редактируется здесь — см. architecture.md §2).</p>
      </div>

      <ChannelsTab channels={channels} reload={reloadChannels} />
    </div>
  );
}
