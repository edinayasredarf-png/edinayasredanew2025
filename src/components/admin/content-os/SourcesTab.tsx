"use client";

import React, { useEffect, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import { convertSourceItemToTopic, deleteSource, dismissSourceItem, listSourceItems, pollSources, upsertSource } from "@/lib/contentOsStore";
import { CONTENT_SOURCE_TYPES, type ContentSource, type ContentSourceItem, type ContentSourceItemStatus, type ContentSourceType } from "@/lib/contentOsTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const EMPTY = { name: "", type: "keyword" as ContentSourceType, url: "", external_id: "", priority: 5, poll_interval: 60, categories: "", tags: "" };

export default function SourcesTab({ sources, reload }: { sources: ContentSource[]; reload: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) { setError("Укажите название и URL/запрос"); return; }
    setSaving(true); setError("");
    try {
      await upsertSource({
        name: form.name.trim(), type: form.type, url: form.url.trim(), external_id: form.external_id.trim() || null,
        priority: Number(form.priority) || 5, poll_interval: Number(form.poll_interval) || 60, active: true,
        categories: form.categories.split(",").map((s) => s.trim()).filter(Boolean),
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      });
      await reload();
      setForm(EMPTY);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: ContentSource) => {
    await upsertSource({ id: s.id, name: s.name, type: s.type, url: s.url, active: !s.active });
    await reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить источник? Собранные записи ленты останутся.")) return;
    await deleteSource(id); await reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Источники</h2>
          <p className="text-sm text-gray-500">
            Источники и сбор новостей для поиска тем — свой реестр и своя лента, не зависит от других разделов сайта.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Как это работает: «Поиск по словам» ищет упоминания через Google News (надёжнее всего — подходит почти для любой темы);
            «RSS-лента» читает конкретный адрес ленты напрямую (нужно знать точный URL); «Telegram-канал» читает публичные посты без токена.
            У сайтов без собственной RSS-ленты прямого парсинга нет — для них используйте «Поиск по словам».
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5]">
          + Источник
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-5 mb-6">
          {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Название *</label>
              <input className={inputClass()} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Тип</label>
              <Select value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v as ContentSourceType }))} options={CONTENT_SOURCE_TYPES.map((t) => ({ value: t.key, label: t.label }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>URL / ключевые слова / канал *</label>
              <input className={inputClass()} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder={form.type === "telegram" ? "имя_канала" : form.type === "keyword" ? '"фраза" OR "ещё фраза"' : "https://..."} />
            </div>
            <div>
              <label className={labelCls}>External ID</label>
              <input className={inputClass()} value={form.external_id} onChange={(e) => setForm((f) => ({ ...f, external_id: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Приоритет (1-10)</label>
              <input type="number" min={1} max={10} className={inputClass()} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))} />
            </div>
            <div>
              <label className={labelCls}>Опрос, мин</label>
              <input type="number" min={5} className={inputClass()} value={form.poll_interval} onChange={(e) => setForm((f) => ({ ...f, poll_interval: Number(e.target.value) }))} />
            </div>
            <div>
              <label className={labelCls}>Категории (через запятую)</label>
              <input className={inputClass()} value={form.categories} onChange={(e) => setForm((f) => ({ ...f, categories: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Теги (через запятую)</label>
              <input className={inputClass()} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Отмена</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase">
              <th className="pb-2">Название</th><th className="pb-2">Тип</th><th className="pb-2">Приоритет</th>
              <th className="pb-2">Опрос</th><th className="pb-2">Собрано</th><th className="pb-2">Активен</th><th className="pb-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sources.map((s) => (
              <tr key={s.id}>
                <td className="py-2 pr-3">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-[11px] text-gray-400 truncate max-w-xs">{s.url}</p>
                </td>
                <td className="py-2 pr-3 text-gray-600">{CONTENT_SOURCE_TYPES.find((t) => t.key === s.type)?.label}</td>
                <td className="py-2 pr-3 text-gray-600">{s.priority}</td>
                <td className="py-2 pr-3 text-gray-600">{s.poll_interval} мин</td>
                <td className="py-2 pr-3 text-gray-500 text-xs">{s.last_polled_at ? new Date(s.last_polled_at).toLocaleString("ru-RU") : "ещё не опрашивался"}</td>
                <td className="py-2 pr-3">
                  <button onClick={() => toggleActive(s)} className={`w-9 h-5 rounded-full relative transition-colors ${s.active ? "bg-[#029cda]" : "bg-gray-200"}`}>
                    <span className={`absolute top-0.5 h-4 w-4 bg-white rounded-full transition-transform ${s.active ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
                <td className="py-2"><button onClick={() => remove(s.id)} className="text-[11px] text-red-500 hover:text-red-700">Удалить</button></td>
              </tr>
            ))}
            {sources.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-gray-400">Источников пока нет.</td></tr>}
          </tbody>
        </table>
      </div>

      <SourceFeed />
    </div>
  );
}

const FEED_TABS: { key: ContentSourceItemStatus; label: string }[] = [
  { key: "new", label: "Новые" },
  { key: "used", label: "Использованные" },
  { key: "dismissed", label: "Скрытые" },
];

function SourceFeed() {
  const [tab, setTab] = useState<ContentSourceItemStatus>("new");
  const [items, setItems] = useState<ContentSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [pollMsg, setPollMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = (status: ContentSourceItemStatus) => {
    setLoading(true);
    listSourceItems({ status }).then(setItems).finally(() => setLoading(false));
  };

  useEffect(() => { load(tab); }, [tab]);

  const poll = async () => {
    setPolling(true); setPollMsg(null);
    try {
      const r = await pollSources();
      const errSuffix = r.errors.length ? `, ошибок: ${r.errors.length}` : "";
      setPollMsg(`Опрошено источников: ${r.sources}, собрано новых записей: ${r.saved}${errSuffix}`);
      if (tab === "new") load("new");
    } catch (e) {
      setPollMsg(e instanceof Error ? e.message : "Ошибка опроса");
    } finally {
      setPolling(false);
    }
  };

  const toTopic = async (id: string) => {
    setBusyId(id);
    try { await convertSourceItemToTopic(id); setItems((v) => v.filter((i) => i.id !== id)); }
    finally { setBusyId(null); }
  };

  const dismiss = async (id: string) => {
    setBusyId(id);
    try { await dismissSourceItem(id); setItems((v) => v.filter((i) => i.id !== id)); }
    finally { setBusyId(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Лента</h3>
          <p className="text-xs text-gray-500">Собранные записи по активным источникам — отсюда темы уходят в «Идеи».</p>
        </div>
        <button onClick={poll} disabled={polling} className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 whitespace-nowrap">
          {polling ? "Собираем..." : "🔄 Собрать сейчас"}
        </button>
      </div>

      {pollMsg && <p className="text-xs text-gray-600 bg-[#F6F7F9] rounded-lg px-3 py-2 mb-3">{pollMsg}</p>}

      <div className="flex gap-1 mb-3 border-b border-gray-100">
        {FEED_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${tab === t.key ? "border-[#029cda] text-[#029cda]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400 py-8 text-center">Загрузка...</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">
          {tab === "new" ? "Пока пусто — нажмите «Собрать сейчас» или подождите следующего опроса." : "Ничего нет."}
        </p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.category}</span>
                <span className="text-[11px] text-gray-400">{item.source_name}</span>
                <span className="text-[11px] text-gray-300">·</span>
                <span className="text-[11px] text-gray-400">{new Date(item.published_at).toLocaleString("ru-RU")}</span>
              </div>
              <a href={item.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-900 hover:text-[#029cda] line-clamp-2">{item.title}</a>
              {item.snippet && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.snippet}</p>}
            </div>
            {tab === "new" && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => toTopic(item.id)} disabled={busyId === item.id} className="px-3 py-1.5 bg-[#029cda] text-white text-xs font-semibold rounded-lg whitespace-nowrap disabled:opacity-60">
                  → Создать тему
                </button>
                <button onClick={() => dismiss(item.id)} disabled={busyId === item.id} className="px-3 py-1.5 text-gray-400 hover:text-gray-700 text-xs font-medium whitespace-nowrap">
                  Скрыть
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
