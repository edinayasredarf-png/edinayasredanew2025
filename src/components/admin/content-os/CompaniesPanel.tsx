"use client";

import React, { useState } from "react";
import { inputClass } from "@/components/admin/ui/Field";
import { deactivateCompany, upsertCompany } from "@/lib/contentOsStore";
import { DEFAULT_COMPANY_ID, type ContentCompany } from "@/lib/contentOsTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const EMPTY = { name: "", description: "" };

/**
 * CRUD компаний/брендов (database.md §10). Пока только управление
 * записями — переключатель активной компании и фильтрация остального
 * Content OS по company_id ещё не подключены (следующий шаг).
 */
export default function CompaniesPanel({ companies, reload }: { companies: ContentCompany[]; reload: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name.trim()) { setError("Укажите название"); return; }
    setSaving(true); setError("");
    try {
      await upsertCompany({ name: form.name.trim(), description: form.description.trim() });
      await reload();
      setForm(EMPTY);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: ContentCompany) => {
    if (!confirm(`Деактивировать «${c.name}»? Данные останутся, компания пропадёт из активных.`)) return;
    try { await deactivateCompany(c.id); await reload(); }
    catch (e) { alert(e instanceof Error ? e.message : "Не удалось деактивировать"); }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">🏢 Компании</h3>
          <p className="text-xs text-gray-500 mt-0.5">Бренды/клиенты внутри раздела «Контент» — общий доступ команды, без отдельных логинов.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="px-3 py-1.5 bg-[#029cda] text-white text-xs font-semibold rounded-lg hover:bg-[#0280b5]">
          + Компания
        </button>
      </div>

      {showForm && (
        <div className="bg-[#F6F7F9] rounded-xl border border-[#e8eaed] p-4 mb-4">
          {error && <div className="mb-3 p-2 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Название *</label>
              <input className={inputClass()} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Описание</label>
              <input className={inputClass()} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={save} disabled={saving} className="px-4 py-1.5 bg-[#029cda] text-white text-xs font-semibold rounded-lg hover:bg-[#0280b5] disabled:opacity-60">
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900">Отмена</button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {companies.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {c.name}
                {c.id === DEFAULT_COMPANY_ID && <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700">по умолчанию</span>}
              </p>
              {c.description && <p className="text-xs text-gray-500 truncate">{c.description}</p>}
            </div>
            {c.id !== DEFAULT_COMPANY_ID && (
              <button onClick={() => remove(c)} className="text-[11px] text-red-500 hover:text-red-700 shrink-0 ml-3">Деактивировать</button>
            )}
          </div>
        ))}
        {companies.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Компаний пока нет.</p>}
      </div>
    </div>
  );
}
