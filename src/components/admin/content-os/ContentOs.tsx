"use client";

import React, { useCallback, useEffect, useState } from "react";
import { listBrandDocuments, listChannels, listClusters, listSources, listTopics } from "@/lib/contentOsStore";
import type { ContentBrandDocument, ContentChannelProfile, ContentCluster, ContentSource, ContentTopic } from "@/lib/contentOsTypes";
import DashboardTab from "./DashboardTab";
import IdeasTab from "./IdeasTab";
import SourcesTab from "./SourcesTab";
import ContentPlanTab from "./ContentPlanTab";
import ArticlesTab from "./ArticlesTab";
import SocialTab from "./SocialTab";
import BrandTab from "./BrandTab";
import SeoTab from "./SeoTab";
import ResearchTab from "./ResearchTab";
import PublicationsTab from "./PublicationsTab";
import AnalyticsTab from "./AnalyticsTab";
import SettingsTab from "./SettingsTab";
import ClusterDetail from "./ClusterDetail";
import { upsertCluster } from "@/lib/contentOsStore";

// Разделы админки — ровно по §14 ТЗ (Emails исключён: канал отложен, см. architecture.md).
type View = "dashboard" | "ideas" | "sources" | "plan" | "articles" | "social" | "brand" | "seo" | "research" | "publications" | "analytics" | "settings";

const TABS: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "ideas", label: "Ideas", icon: "💡" },
  { id: "sources", label: "Sources", icon: "📡" },
  { id: "plan", label: "Content Plan", icon: "📅" },
  { id: "articles", label: "Articles", icon: "📄" },
  { id: "social", label: "Social", icon: "✈️" },
  { id: "brand", label: "Brand", icon: "🏷️" },
  { id: "seo", label: "SEO", icon: "🔍" },
  { id: "research", label: "Research", icon: "🔎" },
  { id: "publications", label: "Publications", icon: "🚀" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function ContentOs() {
  const [view, setView] = useState<View>("dashboard");
  const [topics, setTopics] = useState<ContentTopic[]>([]);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [clusters, setClusters] = useState<ContentCluster[]>([]);
  const [channels, setChannels] = useState<ContentChannelProfile[]>([]);
  const [brandDocs, setBrandDocs] = useState<ContentBrandDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [openClusterId, setOpenClusterId] = useState<string | null>(null);

  const reloadTopics = useCallback(async () => setTopics(await listTopics()), []);
  const reloadSources = useCallback(async () => setSources(await listSources()), []);
  const reloadClusters = useCallback(async () => setClusters(await listClusters()), []);
  const reloadChannels = useCallback(async () => setChannels(await listChannels()), []);
  const reloadBrand = useCallback(async () => setBrandDocs(await listBrandDocuments()), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([reloadTopics(), reloadSources(), reloadClusters(), reloadChannels(), reloadBrand()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadTopics, reloadSources, reloadClusters, reloadChannels, reloadBrand]);

  const developTopic = async (topic: ContentTopic) => {
    const { id } = await upsertCluster({ title: topic.title, primary_topic_id: topic.id });
    await reloadClusters();
    setOpenClusterId(id);
  };

  const closeDetail = async () => {
    setOpenClusterId(null);
    await reloadClusters();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content OS</h1>
          <p className="text-sm text-gray-500">Source → Idea → Cluster → Draft (local/cloud AI) → QC → Approval → Plan → Publication.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-2xl bg-[#F6F7F9] p-1 mb-5">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition ${view === t.id ? "bg-white shadow text-[#029cda]" : "text-gray-600 hover:text-gray-900"}`}>
            <span className="mr-1.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-10 text-center">Загрузка...</p>
      ) : (
        <>
          {view === "dashboard" && <DashboardTab onOpenCluster={setOpenClusterId} />}
          {view === "ideas" && <IdeasTab topics={topics} reload={reloadTopics} onDevelop={developTopic} />}
          {view === "sources" && <SourcesTab sources={sources} reload={reloadSources} />}
          {view === "plan" && <ContentPlanTab onOpenCluster={setOpenClusterId} />}
          {view === "articles" && <ArticlesTab onOpenCluster={setOpenClusterId} />}
          {view === "social" && <SocialTab onOpenCluster={setOpenClusterId} />}
          {view === "brand" && <BrandTab documents={brandDocs} reload={reloadBrand} />}
          {view === "seo" && <SeoTab onOpenCluster={setOpenClusterId} />}
          {view === "research" && <ResearchTab clusters={clusters} onOpenCluster={setOpenClusterId} />}
          {view === "publications" && <PublicationsTab />}
          {view === "analytics" && <AnalyticsTab />}
          {view === "settings" && <SettingsTab channels={channels} reloadChannels={reloadChannels} />}
        </>
      )}

      {openClusterId && <ClusterDetail clusterId={openClusterId} channels={channels} onClose={closeDetail} onChanged={reloadClusters} />}
    </div>
  );
}
