"use client";

import React, { useState } from "react";
import { inputClass } from "@/components/admin/ui/Field";
import { classifyTopic, deleteTopic, upsertTopic } from "@/lib/contentOsStore";
import type { ContentTopic } from "@/lib/contentOsTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const EMPTY_FORM = { title: "", thesis: "", relevance: 7, popularity: 60 };

export default function IdeasTab({ topics, reload, onDevelop }: {
  topics: ContentTopic[];
  reload: () => Promise<void>;
  onDevelop: (topic: ContentTopic) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [classifying, setClassifying] = useState<string | null>(null);

  const save = async () => {
    if (!form.title.trim()) { setError("Укажите заголовок темы"); return; }
    setSaving(true); setError("");
    try {
      await upsertTopic({ title: form.title.trim(), thesis: form.thesis.trim(), relevance: Number(form.relevance) || 5, popularity: Number(form.popularity) || 50 });
      await reload();
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить тему?")) return;
    try { await deleteTopic(id); await reload(); } catch { alert("Ошибка удаления"); }
  };

  const classify = async (id: string) => {
    setClassifying(id);
    try { await classifyTopic(id); await reload(); }
    catch (e) { alert(e instanceof Error ? e.message : "Ошибка оценки"); }
    finally { setClassifying(null); }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Идеи</h2>
          <p className="text-sm text-gray-500">
            Портфель тем. Source → topic extraction → classification (§19 ТЗ) — «Оценить ИИ» проставляет relevance/popularity.
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5]">
          + Новая идея
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-5 mb-6">
          {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Заголовок темы *</label>
              <input className={inputClass()} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Тезисы / факты</label>
              <textarea className={inputClass()} rows={3} value={form.thesis} onChange={(e) => setForm((f) => ({ ...f, thesis: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Релевантность (1-10)</label>
              <input type="number" min={1} max={10} className={inputClass()} value={form.relevance} onChange={(e) => setForm((f) => ({ ...f, relevance: Number(e.target.value) }))} />
            </div>
            <div>
              <label className={labelCls}>Популярность (1-100)</label>
              <input type="number" min={1} max={100} className={inputClass()} value={form.popularity} onChange={(e) => setForm((f) => ({ ...f, popularity: Number(e.target.value) }))} />
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

      <div className="space-y-2">
        {topics.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">Идей пока нет. Источники — во вкладке «Sources».</p>}
        {topics.map((t) => (
          <div key={t.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{t.title}</p>
              {t.thesis && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.thesis}</p>}
              <p className="text-[11px] text-gray-400 mt-1">Релевантность {t.relevance} · Популярность {t.popularity} · {t.status}{(t.source_item_id || t.radar_item_id) ? " · из мониторинга" : ""}</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 items-end">
              <button onClick={() => onDevelop(t)} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#029cda]/10 text-[#029cda] hover:bg-[#029cda]/15">✍️ Развить</button>
              <button onClick={() => classify(t.id)} disabled={classifying === t.id} className="text-[11px] text-gray-500 hover:text-gray-800 disabled:opacity-50">
                {classifying === t.id ? "Оценка..." : "🤖 Оценить ИИ"}
              </button>
              <button onClick={() => remove(t.id)} className="text-[11px] text-red-500 hover:text-red-700">Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
