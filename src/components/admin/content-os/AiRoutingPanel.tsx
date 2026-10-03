"use client";

import React, { useEffect, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { CONTENT_OS_TASK_LABELS, type ContentOsTask } from "@/lib/contentOsTypes";

interface RoutingBadge {
  localConfigured: boolean;
  localModel: string | null;
}

interface TaskRoute {
  task: ContentOsTask;
  provider: "local" | "anthropic";
  model: string | null;
  isOverride: boolean;
  defaultProvider: "local" | "anthropic";
  defaultModel: string | null;
}

// Небольшой фиксированный список — в отличие от шлюза, у Claude нет смысла
// тянуть каталог динамически (несколько моделей, редко меняются).
const CLAUDE_MODELS = ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"];

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`/api/content-os${path}`, { ...init, credentials: "include" });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { const j = JSON.parse(text) as { error?: string }; if (j?.error) msg = j.error; } catch { /* raw */ }
    throw new Error(msg || res.statusText);
  }
  return text ? JSON.parse(text) : null;
}

/**
 * Выбор AI-модели по каждой задаче Content OS. "Шлюз" — любой OpenAI-
 * совместимый endpoint в SELFHOSTED_LLM_URL (self-hosted сервер или
 * облачный шлюз вроде Timeweb AI Gateway — провайдер в коде так и
 * называется "local" по историческим причинам, но физически это уже не
 * обязательно локальный сервер, см. комментарий в src/lib/ai/router.ts).
 */
export default function AiRoutingPanel() {
  const [badge, setBadge] = useState<RoutingBadge | null>(null);
  const [routes, setRoutes] = useState<TaskRoute[] | null>(null);
  const [gatewayModels, setGatewayModels] = useState<string[] | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [savingTask, setSavingTask] = useState<string | null>(null);

  const loadRoutes = () => api("/settings/ai-routes").then((d) => setRoutes(d.routes));

  useEffect(() => {
    api("/settings/routing").then(setBadge).catch(() => {});
    loadRoutes().catch(() => {});
    api("/settings/gateway-models")
      .then((d) => setGatewayModels(d.models))
      .catch((e) => setGatewayError(e instanceof Error ? e.message : "Не удалось получить список моделей"));
  }, []);

  const updateRoute = async (task: ContentOsTask, provider: "local" | "anthropic", model: string | null) => {
    setSavingTask(task);
    try {
      await api("/settings/ai-routes", { method: "POST", body: JSON.stringify({ task, provider, model }) });
      await loadRoutes();
    } finally {
      setSavingTask(null);
    }
  };

  const resetRoute = async (task: ContentOsTask) => {
    setSavingTask(task);
    try {
      await api(`/settings/ai-routes?task=${task}`, { method: "DELETE" });
      await loadRoutes();
    } finally {
      setSavingTask(null);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">🧭 Какая модель что пишет</h3>
        {badge && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.localConfigured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {badge.localConfigured ? `Шлюз: ${badge.localModel || "подключён"}` : "Шлюз не подключён"}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Для каждой задачи можно выбрать, какая модель её выполняет: ваш шлюз (self-hosted сервер или облачный шлюз, например Timeweb AI Gateway) или облачный Claude.
        Если выбранная модель недоступна или отвечает с ошибкой — задача автоматически уходит в Claude, чтобы ничего не ломалось.
      </p>
      {gatewayError && (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5 mb-3">
          Список моделей шлюза получить не удалось: {gatewayError}. Можно продолжать работать на Claude или ввести модель шлюза позже.
        </p>
      )}

      {!routes && <p className="text-xs text-gray-400">Загрузка...</p>}
      {routes && (
        <div className="space-y-2">
          {routes.map((r) => {
            const modelOptions = r.provider === "local"
              ? (gatewayModels ?? []).map((m) => ({ value: m, label: m }))
              : CLAUDE_MODELS.map((m) => ({ value: m, label: m }));
            const currentModel = r.model ?? "";
            return (
              <div key={r.task} className="flex items-center gap-2 flex-wrap bg-[#F6F7F9] rounded-xl px-3 py-2">
                <span className="text-xs text-gray-700 w-40 shrink-0">{CONTENT_OS_TASK_LABELS[r.task]}</span>
                <div className="w-40">
                  <Select
                    value={r.provider}
                    onChange={(v) => updateRoute(r.task, v as "local" | "anthropic", null)}
                    options={[{ value: "local", label: "Шлюз" }, { value: "anthropic", label: "Claude (облако)" }]}
                  />
                </div>
                <div className="w-56">
                  <Select
                    value={currentModel}
                    onChange={(v) => updateRoute(r.task, r.provider, v || null)}
                    options={[{ value: "", label: "По умолчанию" }, ...modelOptions]}
                  />
                </div>
                {savingTask === r.task && <span className="text-[11px] text-gray-400">Сохраняем...</span>}
                {r.isOverride && savingTask !== r.task && (
                  <button onClick={() => resetRoute(r.task)} className="text-[11px] text-gray-400 hover:text-gray-700">Сбросить по умолчанию</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
