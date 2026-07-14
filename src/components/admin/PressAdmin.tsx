"use client";

import React, { useEffect, useRef, useState } from "react";
import { listPress, upsertPress, deletePress, PressItem } from "@/lib/pressStore";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const EMPTY_FORM = {
  title: "",
  source_name: "",
  source_logo: "",
  link: "",
  published_at: Date.now(),
};

type FormData = typeof EMPTY_FORM;

export default function PressAdmin() {
  const [items, setItems] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await listPress()); } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, published_at: Date.now() });
    setError("");
    setShowForm(true);
  };

  const openEdit = (item: PressItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      source_name: item.source_name,
      source_logo: item.source_logo,
      link: item.link,
      published_at: item.published_at,
    });
    setError("");
    setShowForm(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/image", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url?: string };
      if (!data.url) throw new Error("No URL");
      setForm(f => ({ ...f, source_logo: data.url! }));
    } catch {
      setError("Ошибка загрузки логотипа");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Укажите заголовок"); return; }
    if (!form.link.trim()) { setError("Укажите ссылку"); return; }
    setSaving(true);
    setError("");
    try {
      const id = editingId ?? genId();
      await upsertPress({
        id,
        title: form.title.trim(),
        source_name: form.source_name.trim(),
        source_logo: form.source_logo.trim(),
        link: form.link.trim(),
        published_at: form.published_at,
        created_at: Date.now(),
      });
      await load();
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить публикацию?")) return;
    setDeleting(id);
    try {
      await deletePress(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert("Ошибка удаления");
    } finally {
      setDeleting(null);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-[#e0e0e0] rounded-xl text-[14px] text-[#313131] focus:outline-none focus:ring-2 focus:ring-[#029cda]/40 focus:border-[#029cda]";
  const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#1a1a1a]">СМИ о нас</h2>
          <p className="text-[13px] text-[#8c9099] mt-0.5">Публикации в изданиях об «Единой среде»</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#029cda] text-white text-[14px] font-semibold rounded-xl hover:bg-[#0280b5] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Добавить публикацию
        </button>
      </div>

      {/* Форма добавления/редактирования */}
      {showForm && (
        <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-5 mb-6">
          <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-5">
            {editingId ? "Редактировать публикацию" : "Новая публикация"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Заголовок статьи *</label>
              <input
                className={inputCls}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Как «Единая среда» помогает городам..."
              />
            </div>
            <div>
              <label className={labelCls}>Название издания</label>
              <input
                className={inputCls}
                value={form.source_name}
                onChange={e => setForm(f => ({ ...f, source_name: e.target.value }))}
                placeholder="РБК, Коммерсантъ..."
              />
            </div>
            <div>
              <label className={labelCls}>Дата публикации</label>
              <input
                type="date"
                className={inputCls}
                value={new Date(Number(form.published_at)).toISOString().slice(0, 10)}
                onChange={e => {
                  const d = new Date(e.target.value);
                  setForm(f => ({ ...f, published_at: isNaN(d.getTime()) ? f.published_at : d.getTime() }));
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Ссылка на статью *</label>
              <input
                className={inputCls}
                value={form.link}
                onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Логотип издания</label>
              <div className="flex items-center gap-4">
                {form.source_logo && (
                  <div className="w-[120px] h-9 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.source_logo} alt="Логотип" className="max-h-9 w-auto object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    className={inputCls}
                    value={form.source_logo}
                    onChange={e => setForm(f => ({ ...f, source_logo: e.target.value }))}
                    placeholder="URL логотипа или загрузите файл"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="shrink-0 px-3 py-2 border border-[#e0e0e0] rounded-xl text-[13px] text-[#52555a] hover:bg-[#f5f6f8] transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {logoUploading ? "Загрузка…" : "Загрузить"}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
            </div>
          </div>

          {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#029cda] text-white text-[14px] font-semibold rounded-xl hover:bg-[#0280b5] transition-colors disabled:opacity-60"
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-[#e0e0e0] text-[#52555a] text-[14px] rounded-xl hover:bg-[#f5f6f8] transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список публикаций */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#F6F7F9] rounded-2xl h-[72px] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#F6F7F9] rounded-2xl border border-dashed border-[#e0e0e0] p-12 text-center text-[#8c9099] text-[14px]">
          Публикаций пока нет. Нажмите «Добавить публикацию»
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] px-5 py-4 flex items-center gap-4">
              {item.source_logo && (
                <div className="w-[80px] h-8 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.source_logo} alt={item.source_name} className="max-h-8 w-auto object-contain" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#1a1a1a] truncate">{item.title}</p>
                <p className="text-[12px] text-[#9ca3af] mt-0.5">
                  {item.source_name && <span className="mr-2">{item.source_name}</span>}
                  {new Date(Number(item.published_at)).toLocaleDateString("ru-RU")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8c9099] hover:bg-[#f5f6f8] hover:text-[#029cda] transition-colors"
                  title="Открыть статью"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
                <button
                  onClick={() => openEdit(item)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8c9099] hover:bg-[#f5f6f8] hover:text-[#313131] transition-colors"
                  title="Редактировать"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8c9099] hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Удалить"
                >
                  {deleting === item.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
