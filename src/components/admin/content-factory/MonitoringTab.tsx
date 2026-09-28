"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import { listItems, refreshRadar, setItemStatus, type RadarRefreshResult } from "@/lib/radarStore";
import { RADAR_CATEGORIES, RADAR_STATUSES, radarCategoryColor, radarCategoryLabel, type RadarItem } from "@/lib/radarTypes";
import { upsertTopic } from "@/lib/contentFactoryStore";
import type { CfRubric } from "@/lib/contentFactoryTypes";

function timeAgo(ts: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86_400_000);
  if (d > 0) return `${d} дн. назад`;
  const h = Math.floor(diff / 3_600_000);
  if (h > 0) return `${h} ч. назад`;
  const m = Math.floor(diff / 60_000);
  if (m > 0) return `${m} мин. назад`;
  return "только что";
}

export default function MonitoringTab({ rubrics, onTopicCreated }: {
  rubrics: CfRubric[];
  onTopicCreated: () => Promise<void>;
}) {
  const [items, setItems] = useState<RadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("new");
  const [q, setQ] = useState("");
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listItems({ category, status, q })); }
    catch (e) { setMsg({ kind: "err", text: e instanceof Error ? e.message : "Ошибка загрузки" }); }
    finally { setLoading(false); }
  }, [category, status, q]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true); setMsg(null);
    try {
      const res: RadarRefreshResult = await refreshRadar();
      const errNote = res.errors.length ? `, ошибок: ${res.errors.length}` : "";
      setMsg({ kind: "ok", text: `Обновлено: ${res.triggers} триггеров, найдено ${res.fetched}, сохранено ${res.saved}${errNote}` });
      await load();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Ошибка обновления" });
    } finally { setRefreshing(false); }
  };

  const dismiss = async (it: RadarItem) => {
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    try { await setItemStatus(it.id, "dismissed"); } catch { load(); }
  };

  const createTopic = async (it: RadarItem, rubricId: string, relevance: number, popularity: number) => {
    await upsertTopic({
      title: it.title,
      rubric_id: rubricId || null,
      source_name: it.source_name,
      source_url: it.link,
      thesis: it.snippet,
      relevance, popularity,
      status: "new",
      radar_item_id: it.id,
    });
    await setItemStatus(it.id, "used");
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    setCreatingId(null);
    await onTopicCreated();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Мониторинг инфополя</h2>
          <p className="text-sm text-gray-500">
            Лента новостного радара — превращайте релевантные материалы в темы одним кликом. Источники и триггеры настраиваются в разделе «Новостной радар».
          </p>
        </div>
        <button onClick={onRefresh} disabled={refreshing} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
          {refreshing ? "Собираем..." : "▶ Собрать сейчас"}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${msg.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Select value={category} onChange={setCategory} className="w-56"
          options={[{ value: "all", label: "Все категории" }, ...RADAR_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]} />
        <Select value={status} onChange={setStatus} className="w-48"
          options={[{ value: "all", label: "Все статусы" }, ...RADAR_STATUSES.map((s) => ({ value: s.key, label: s.label }))]} />
        <input className={`${inputClass()} w-56`} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") load(); }} placeholder="Поиск..." />
      </div>

      {loading && <p className="text-sm text-gray-400 py-6 text-center">Загрузка...</p>}
      {!loading && items.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">Ничего не найдено по этому фильтру.</p>}

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
            <div className="flex items-start gap-3">
              <span className="text-[11px] font-semibold px-2 py-1 rounded-lg text-white shrink-0" style={{ background: radarCategoryColor(it.category) }}>
                {radarCategoryLabel(it.category)}
              </span>
              <div className="flex-1 min-w-0">
                <a href={it.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-900 hover:text-[#029cda]">{it.title}</a>
                <p className="text-[11px] text-gray-400 mt-1">{it.source_name} · {timeAgo(it.published_at)}</p>
                {it.snippet && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{it.snippet}</p>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => setCreatingId(creatingId === it.id ? null : it.id)} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#029cda]/10 text-[#029cda] hover:bg-[#029cda]/15">
                  💡 В тему
                </button>
                <button onClick={() => dismiss(it)} className="px-2.5 py-1 rounded-lg text-[11px] text-gray-400 hover:text-gray-700">Скрыть</button>
              </div>
            </div>
            {creatingId === it.id && (
              <QuickTopicForm rubrics={rubrics} onCancel={() => setCreatingId(null)} onSave={(rubricId, rel, pop) => createTopic(it, rubricId, rel, pop)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickTopicForm({ rubrics, onCancel, onSave }: {
  rubrics: CfRubric[];
  onCancel: () => void;
  onSave: (rubricId: string, relevance: number, popularity: number) => void | Promise<void>;
}) {
  const [rubricId, setRubricId] = useState("");
  const [relevance, setRelevance] = useState(7);
  const [popularity, setPopularity] = useState(60);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try { await onSave(rubricId, relevance, popularity); } finally { setBusy(false); }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-[11px] text-gray-500 mb-1">Рубрика</label>
        <Select value={rubricId} onChange={setRubricId} className="w-52"
          options={[{ value: "", label: "Без рубрики" }, ...rubrics.map((r) => ({ value: r.id, label: `${r.icon} ${r.name}` }))]} />
      </div>
      <div>
        <label className="block text-[11px] text-gray-500 mb-1">Релевантность</label>
        <input type="number" min={1} max={10} className={`${inputClass()} w-20`} value={relevance} onChange={(e) => setRelevance(Number(e.target.value))} />
      </div>
      <div>
        <label className="block text-[11px] text-gray-500 mb-1">Популярность</label>
        <input type="number" min={1} max={100} className={`${inputClass()} w-20`} value={popularity} onChange={(e) => setPopularity(Number(e.target.value))} />
      </div>
      <button disabled={busy} onClick={save} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
        {busy ? "Создание..." : "Создать тему"}
      </button>
      <button onClick={onCancel} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-800">Отмена</button>
    </div>
  );
}
