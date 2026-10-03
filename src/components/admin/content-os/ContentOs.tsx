"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getActiveCompanyIdClient, listBrandDocuments, listChannels, listClusters, listCompanies, listSources, listTopics, setActiveCompanyIdClient } from "@/lib/contentOsStore";
import { DEFAULT_COMPANY_ID, type ContentBrandDocument, type ContentChannelProfile, type ContentCluster, type ContentCompany, type ContentSource, type ContentTopic } from "@/lib/contentOsTypes";
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
  { id: "dashboard", label: "Обзор", icon: "🏠" },
  { id: "ideas", label: "Идеи", icon: "💡" },
  { id: "sources", label: "Источники", icon: "📡" },
  { id: "plan", label: "Контент-план", icon: "📅" },
  { id: "articles", label: "Статьи", icon: "📄" },
  { id: "social", label: "Соцсети", icon: "✈️" },
  { id: "brand", label: "Бренд", icon: "🏷️" },
  { id: "seo", label: "SEO", icon: "🔍" },
  { id: "research", label: "Исследования", icon: "🔎" },
  { id: "publications", label: "Публикации", icon: "🚀" },
  { id: "analytics", label: "Аналитика", icon: "📊" },
  { id: "settings", label: "Настройки", icon: "⚙️" },
];

export default function ContentOs() {
  const [view, setView] = useState<View>("dashboard");
  const [topics, setTopics] = useState<ContentTopic[]>([]);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [clusters, setClusters] = useState<ContentCluster[]>([]);
  const [channels, setChannels] = useState<ContentChannelProfile[]>([]);
  const [brandDocs, setBrandDocs] = useState<ContentBrandDocument[]>([]);
  const [companies, setCompanies] = useState<ContentCompany[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>(DEFAULT_COMPANY_ID);
  const [loading, setLoading] = useState(true);
  const [openClusterId, setOpenClusterId] = useState<string | null>(null);

  const reloadTopics = useCallback(async () => setTopics(await listTopics()), []);
  const reloadSources = useCallback(async () => setSources(await listSources()), []);
  const reloadClusters = useCallback(async () => setClusters(await listClusters()), []);
  const reloadChannels = useCallback(async () => setChannels(await listChannels()), []);
  const reloadBrand = useCallback(async () => setBrandDocs(await listBrandDocuments()), []);
  const reloadCompanies = useCallback(async () => setCompanies(await listCompanies()), []);

  // company_id читается на сервере из cookie (src/lib/server/contentOsCompany.ts),
  // не из query/пропсов — поэтому простой reload всех company-scoped данных
  // после смены cookie достаточен, без переписывания apiFetch-сигнатур.
  const reloadCompanyScoped = useCallback(
    () => Promise.all([reloadTopics(), reloadSources(), reloadClusters(), reloadChannels(), reloadBrand()]),
    [reloadTopics, reloadSources, reloadClusters, reloadChannels, reloadBrand]
  );

  useEffect(() => {
    const fromCookie = getActiveCompanyIdClient();
    if (fromCookie) setActiveCompanyId(fromCookie);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([reloadCompanyScoped(), reloadCompanies()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadCompanyScoped, reloadCompanies]);

  const switchCompany = async (id: string) => {
    if (id === activeCompanyId) return;
    setActiveCompanyIdClient(id);
    setActiveCompanyId(id);
    setOpenClusterId(null);
    setLoading(true);
    try {
      await reloadCompanyScoped();
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Контент</h1>
          <p className="text-sm text-gray-500">Источник → Идея → Кластер → Черновик (локальный/облачный AI) → Проверка → Утверждение → План → Публикация.</p>
        </div>
        {companies.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">🏢 Компания</span>
            <select
              value={activeCompanyId}
              onChange={(e) => switchCompany(e.target.value)}
              className="text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#029cda]"
            >
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
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
        // key=activeCompanyId — вкладки, которые сами тянут данные по себе
        // (Dashboard/Content Plan/Articles/Social/SEO/Research/Publications/
        // Analytics), перемонтируются при смене компании и запрашивают заново;
        // остальные (Ideas/Sources/Brand/Settings) получают уже перезагруженные
        // пропсы из reloadCompanyScoped.
        <div key={activeCompanyId}>
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
          {view === "settings" && <SettingsTab channels={channels} reloadChannels={reloadChannels} companies={companies} reloadCompanies={reloadCompanies} />}
        </div>
      )}

      {openClusterId && <ClusterDetail clusterId={openClusterId} channels={channels} onClose={closeDetail} onChanged={reloadClusters} />}
    </div>
  );
}
