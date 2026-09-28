"use client";

import React, { useCallback, useEffect, useState } from "react";
import { listPlatforms, listRubrics, listTopics } from "@/lib/contentFactoryStore";
import type { CfPlatform, CfRubric, CfTopic } from "@/lib/contentFactoryTypes";
import MonitoringTab from "./MonitoringTab";
import TopicsTab from "./TopicsTab";
import PlanTab from "./PlanTab";
import EditorTab from "./EditorTab";
import PlatformsTab from "./PlatformsTab";
import AnalyticsTab from "./AnalyticsTab";

type View = "monitoring" | "topics" | "plan" | "editor" | "platforms" | "analytics";

const TABS: { id: View; label: string; icon: string }[] = [
  { id: "monitoring", label: "Мониторинг", icon: "📡" },
  { id: "topics", label: "Темы", icon: "💡" },
  { id: "plan", label: "Контент-план", icon: "📅" },
  { id: "editor", label: "Редактор", icon: "✍️" },
  { id: "platforms", label: "Платформы", icon: "⚙️" },
  { id: "analytics", label: "Аналитика", icon: "📊" },
];

export default function ContentFactory() {
  const [view, setView] = useState<View>("monitoring");
  const [rubrics, setRubrics] = useState<CfRubric[]>([]);
  const [platforms, setPlatforms] = useState<CfPlatform[]>([]);
  const [topics, setTopics] = useState<CfTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorTopicId, setEditorTopicId] = useState<string | null>(null);
  const [editorPlanId, setEditorPlanId] = useState<string | null>(null);

  const reloadRubrics = useCallback(async () => setRubrics(await listRubrics()), []);
  const reloadPlatforms = useCallback(async () => setPlatforms(await listPlatforms()), []);
  const reloadTopics = useCallback(async () => setTopics(await listTopics()), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await Promise.all([reloadRubrics(), reloadPlatforms(), reloadTopics()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [reloadRubrics, reloadPlatforms, reloadTopics]);

  const openTopicInEditor = (topicId: string) => { setEditorPlanId(null); setEditorTopicId(topicId); setView("editor"); };
  const openPlanInEditor = (planId: string) => { setEditorTopicId(null); setEditorPlanId(planId); setView("editor"); };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Контент-завод</h1>
          <p className="text-sm text-gray-500">Мониторинг → темы → контент-план → редактор с ИИ → платформы → аналитика</p>
        </div>
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-[#F6F7F9] p-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${view === t.id ? "bg-white shadow text-[#029cda]" : "text-gray-600 hover:text-gray-900"}`}
          >
            <span className="mr-1.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 py-10 text-center">Загрузка контент-завода...</p>
      ) : (
        <>
          {view === "monitoring" && <MonitoringTab rubrics={rubrics} onTopicCreated={reloadTopics} />}
          {view === "topics" && (
            <TopicsTab rubrics={rubrics} topics={topics} reload={reloadTopics} reloadRubrics={reloadRubrics} onOpenInEditor={openTopicInEditor} />
          )}
          {view === "plan" && <PlanTab platforms={platforms} onOpenInEditor={openPlanInEditor} />}
          {view === "editor" && (
            <EditorTab
              topics={topics}
              platforms={platforms}
              initialTopicId={editorTopicId}
              initialPlanId={editorPlanId}
              onConsumedInitial={() => { setEditorTopicId(null); setEditorPlanId(null); }}
              reloadTopics={reloadTopics}
            />
          )}
          {view === "platforms" && <PlatformsTab platforms={platforms} reload={reloadPlatforms} />}
          {view === "analytics" && <AnalyticsTab rubrics={rubrics} platforms={platforms} />}
        </>
      )}
    </div>
  );
}
