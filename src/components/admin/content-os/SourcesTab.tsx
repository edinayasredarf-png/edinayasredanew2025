"use client";

import React, { useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import { deleteSource, upsertSource } from "@/lib/contentOsStore";
import { CONTENT_SOURCE_TYPES, type ContentSource, type ContentSourceType } from "@/lib/contentOsTypes";

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
    if (!confirm("Удалить источник?")) return;
    await deleteSource(id); await reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sources</h2>
          <p className="text-sm text-gray-500">
            Источники для Topic Hunter (§19 ТЗ). Реальный сбор — через уже работающий пайплайн «Новостного радара» (RSS/Google News/Telegram), здесь — полный реестр с приоритетом и метаданными.
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-gray-400 uppercase">
              <th className="pb-2">Название</th><th className="pb-2">Тип</th><th className="pb-2">Приоритет</th>
              <th className="pb-2">Опрос</th><th className="pb-2">Категории</th><th className="pb-2">Активен</th><th className="pb-2"></th>
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
                <td className="py-2 pr-3 text-gray-500 text-xs">{s.categories.join(", ") || "—"}</td>
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
    </div>
  );
}
