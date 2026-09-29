"use client";

import React, { useCallback, useEffect, useState } from "react";
import { listBrandDocuments, listChannels, listClusters, listTopics } from "@/lib/contentOsStore";
import type { ContentBrandDocument, ContentChannelProfile, ContentCluster, ContentTopic } from "@/lib/contentOsTypes";
import TopicsTab from "./TopicsTab";
import ContentTab from "./ContentTab";
import ChannelsTab from "./ChannelsTab";
import BrandTab from "./BrandTab";
import AnalyticsTab from "./AnalyticsTab";

type View = "topics" | "content" | "channels" | "brand" | "analytics";

const TABS: { id: View; label: string; icon: string }[] = [
  { id: "topics", label: "Темы", icon: "💡" },
  { id: "content", label: "Контент", icon: "✍️" },
  { id: "channels", label: "Каналы", icon: "⚙️" },
  { id: "brand", label: "Бренд", icon: "🏷️" },
  { id: "analytics", label: "Аналитика", icon: "📊" },
];

export default function ContentOs() {
  const [view, setView] = useState<View>("topics");
  const [topics, setTopics] = useState<ContentTopic[]>([]);
  const [clusters, setClusters] = useState<ContentCluster[]>([]);
  const [channels, setChannels] = useState<ContentChannelProfile[]>([]);
  const [brandDocs, setBrandDocs] = useState<ContentBrandDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingTopic, setPendingTopic] = useState<ContentTopic | null>(null);

  const reloadTopics = useCallback(async () => setTopics(await listTopics()), []);
  const reloadClusters = useCallback(async () => setClusters(await listClusters()), []);
  const reloadChannels = useCallback(async () => setChannels(await listChannels()), []);
  const reloadBrand = useCallback(async () => setBrandDocs(await listBrandDocuments()), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([reloadTopics(), reloadClusters(), reloadChannels(), reloadBrand()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadTopics, reloadClusters, reloadChannels, reloadBrand]);

  const useTopicInCluster = (topic: ContentTopic) => { setPendingTopic(topic); setView("content"); };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content OS</h1>
          <p className="text-sm text-gray-500">Тема → кластер → черновик по каналу (local/cloud AI) → утверждение. Первый срез — см. docs/content-os/.</p>
        </div>
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-[#F6F7F9] p-1 mb-5">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${view === t.id ? "bg-white shadow text-[#029cda]" : "text-gray-600 hover:text-gray-900"}`}>
            <span className="mr-1.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-10 text-center">Загрузка...</p>
      ) : (
        <>
          {view === "topics" && <TopicsTab topics={topics} reload={reloadTopics} onUseInCluster={useTopicInCluster} />}
          {view === "content" && (
            <ContentTab
              clusters={clusters} channels={channels}
              reloadClusters={reloadClusters}
              initialTopic={pendingTopic}
              onConsumedInitialTopic={() => setPendingTopic(null)}
            />
          )}
          {view === "channels" && <ChannelsTab channels={channels} reload={reloadChannels} />}
          {view === "brand" && <BrandTab documents={brandDocs} reload={reloadBrand} />}
          {view === "analytics" && <AnalyticsTab />}
        </>
      )}
    </div>
  );
}
