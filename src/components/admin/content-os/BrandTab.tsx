"use client";

import React, { useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import { deleteBrandDocument, upsertBrandDocument } from "@/lib/contentOsStore";
import type { ContentBrandDocument } from "@/lib/contentOsTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const CATEGORIES: { value: ContentBrandDocument["category"]; label: string }[] = [
  { value: "brand-quick-rules", label: "Быстрые правила (тон, УТП, запреты)" },
  { value: "brand", label: "Бренд" },
  { value: "products", label: "Продукты" },
  { value: "company", label: "О компании" },
  { value: "editorial", label: "Редполитика" },
  { value: "seo", label: "SEO" },
  { value: "research", label: "Исследования" },
  { value: "legal", label: "Юридическое" },
];

const EMPTY = { id: "", title: "", category: "brand-quick-rules" as ContentBrandDocument["category"], content: "" };

export default function BrandTab({ documents, reload }: { documents: ContentBrandDocument[]; reload: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openNew = () => { setForm(EMPTY); setError(""); setShowForm(true); };
  const openEdit = (d: ContentBrandDocument) => { setForm({ id: d.id, title: d.title, category: d.category, content: d.content }); setError(""); setShowForm(true); };

  const save = async () => {
    if (!form.title.trim()) { setError("Укажите заголовок"); return; }
    setSaving(true); setError("");
    try {
      await upsertBrandDocument({ id: form.id || undefined, title: form.title.trim(), category: form.category, content: form.content });
      await reload();
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить документ?")) return;
    await deleteBrandDocument(id); await reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">База знаний о бренде</h2>
          <p className="text-sm text-gray-500">
            Подмешивается в промпт при генерации (пока целиком — переход на поиск релевантных фрагментов при росте базы, см. database.md §5).
          </p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5]">
          + Добавить документ
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-5 mb-6">
          {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div>
              <label className={labelCls}>Заголовок *</label>
              <input className={inputClass()} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Категория</label>
              <Select value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v as ContentBrandDocument["category"] }))} options={CATEGORIES} />
            </div>
          </div>
          <label className={labelCls}>Содержимое</label>
          <textarea className={inputClass()} rows={8} value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="Описание компании, УТП, чего избегать, примеры хороших текстов..." />
          <div className="flex items-center gap-2 mt-4">
            <button onClick={save} disabled={saving} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Отмена</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {documents.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">База знаний пуста — без неё генерация пишет нейтральным тоном.</p>}
        {documents.map((d) => (
          <div key={d.id} className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{d.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{CATEGORIES.find((c) => c.value === d.category)?.label}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{d.content}</p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => openEdit(d)} className="px-2 py-1 rounded-lg text-[11px] text-gray-500 hover:text-gray-900">Изм.</button>
              <button onClick={() => remove(d.id)} className="px-2 py-1 rounded-lg text-[11px] text-red-500 hover:text-red-700">Удал.</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
