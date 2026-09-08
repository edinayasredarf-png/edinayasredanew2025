"use client";

import React, { useEffect, useRef, useState } from "react";
import { listAds, upsertAd, deleteAd, AdBanner } from "@/lib/adsStore";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const EMPTY_FORM = {
  image: "",
  href: "",
  alt: "",
};

type FormData = typeof EMPTY_FORM;

export default function AdsAdmin() {
  const [items, setItems] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { setItems(await listAds()); } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setShowForm(true);
  };

  const openEdit = (item: AdBanner) => {
    setEditingId(item.id);
    setForm({ image: item.image, href: item.href, alt: item.alt });
    setError("");
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/image", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url?: string };
      if (!data.url) throw new Error("No URL");
      setForm(f => ({ ...f, image: data.url! }));
    } catch {
      setError("Ошибка загрузки изображения");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.image.trim()) { setError("Загрузите изображение баннера"); return; }
    setSaving(true);
    setError("");
    try {
      const id = editingId ?? genId();
      const existing = editingId ? items.find(i => i.id === editingId) : null;
      const sort = existing ? existing.sort : (items.length ? Math.max(...items.map(i => i.sort)) + 1 : 0);
      await upsertAd({
        id,
        image: form.image.trim(),
        href: form.href.trim(),
        alt: form.alt.trim(),
        sort,
        created_at: existing?.created_at ?? Date.now(),
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
    if (!confirm("Удалить баннер?")) return;
    setDeleting(id);
    try {
      await deleteAd(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert("Ошибка удаления");
    } finally {
      setDeleting(null);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    setReordering(true);
    const a = items[index];
    const b = items[target];
    // меняем местами значения sort и сохраняем оба
    const next = [...items];
    next[index] = { ...b };
    next[target] = { ...a };
    setItems(next);
    try {
      await Promise.all([
        upsertAd({ ...a, sort: b.sort }),
        upsertAd({ ...b, sort: a.sort }),
      ]);
      await load();
    } catch {
      alert("Ошибка изменения порядка");
      await load();
    } finally {
      setReordering(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-[#e0e0e0] rounded-xl text-[14px] text-[#313131] focus:outline-none focus:ring-2 focus:ring-[#029cda]/40 focus:border-[#029cda]";
  const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-[20px] font-bold text-[#1a1a1a]">Реклама</h2>
          <p className="text-[13px] text-[#8c9099] mt-0.5">Баннеры в правой панели блога и новостей</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#029cda] text-white text-[14px] font-semibold rounded-xl hover:bg-[#0280b5] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Добавить баннер
        </button>
      </div>
      <p className="text-[12px] text-[#9ca3af] mb-6">
        Если баннеров нет — панель на сайте не показывается. Рекомендуемый размер изображения — вертикальный, примерно 260×424&nbsp;px.
      </p>

      {/* Форма добавления/редактирования */}
      {showForm && (
        <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-5 mb-6">
          <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-5">
            {editingId ? "Редактировать баннер" : "Новый баннер"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Изображение баннера *</label>
              <div className="flex items-start gap-4">
                {form.image && (
                  <div className="w-[130px] h-[212px] shrink-0 rounded-xl overflow-hidden bg-white border border-[#e8eaed]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image} alt="Превью" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    className={inputCls}
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="URL изображения или загрузите файл"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={imageUploading}
                    className="mt-2 px-3 py-2 border border-[#e0e0e0] rounded-xl text-[13px] text-[#52555a] hover:bg-[#f5f6f8] transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {imageUploading ? "Загрузка…" : "Загрузить изображение"}
                  </button>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Ссылка (куда ведёт баннер)</label>
              <input
                className={inputCls}
                value={form.href}
                onChange={e => setForm(f => ({ ...f, href: e.target.value }))}
                placeholder="https://... или /services"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Описание (alt, для доступности)</label>
              <input
                className={inputCls}
                value={form.alt}
                onChange={e => setForm(f => ({ ...f, alt: e.target.value }))}
                placeholder="Например: Акция на подключение"
              />
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

      {/* Список баннеров */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#F6F7F9] rounded-2xl h-[260px] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[#F6F7F9] rounded-2xl border border-dashed border-[#e0e0e0] p-12 text-center text-[#8c9099] text-[14px]">
          Баннеров пока нет. Нажмите «Добавить баннер».<br/>
          Пока список пуст, рекламная панель на сайте скрыта.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <div key={item.id} className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] overflow-hidden flex flex-col">
              <div className="relative aspect-[260/424] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.alt || "Баннер"} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/55 text-white text-[11px]">
                  #{index + 1}
                </span>
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <p className="text-[12px] text-[#52555a] truncate" title={item.href}>
                  {item.href ? item.href : <span className="text-[#b0b4ba]">без ссылки</span>}
                </p>
                <div className="mt-auto flex items-center gap-1">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reordering}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8c9099] hover:bg-[#f5f6f8] hover:text-[#313131] transition-colors disabled:opacity-30"
                    title="Выше"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1 || reordering}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8c9099] hover:bg-[#f5f6f8] hover:text-[#313131] transition-colors disabled:opacity-30"
                    title="Ниже"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div className="flex-1" />
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
