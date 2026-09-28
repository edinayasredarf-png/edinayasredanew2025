"use client";

import React, { useEffect, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import { ToggleRow } from "@/components/admin/ui/Toggle";
import { deletePlatform, getBrandSettings, saveBrandSettings, upsertPlatform } from "@/lib/contentFactoryStore";
import { CF_PLATFORM_STATUSES, type CfBrandSettings, type CfPlatform, type CfPlatformStatus } from "@/lib/contentFactoryTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const statusBadge: Record<CfPlatformStatus, string> = {
  connected: "bg-green-50 text-green-700",
  setup: "bg-amber-50 text-amber-700",
  manual: "bg-gray-100 text-gray-600",
  planned: "bg-sky-50 text-sky-700",
};

export default function PlatformsTab({ platforms, reload }: { platforms: CfPlatform[]; reload: () => Promise<void> }) {
  const [brand, setBrand] = useState<CfBrandSettings | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📣");

  useEffect(() => { getBrandSettings().then(setBrand).catch(() => {}); }, []);

  const saveBrand = async () => {
    if (!brand) return;
    setSavingBrand(true);
    try { await saveBrandSettings(brand); } finally { setSavingBrand(false); }
  };

  const addPlatform = async () => {
    if (!newName.trim()) return;
    await upsertPlatform({ name: newName.trim(), icon: newIcon.trim() || "📣", status: "planned" });
    setNewName(""); setNewIcon("📣"); setShowAdd(false);
    await reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Платформы и правила бренда</h2>
          <p className="text-sm text-gray-500">Ограничения, тон и обязательные элементы для каждой площадки — используются при генерации.</p>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5]">
          + Добавить платформу
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-4 mb-6 flex items-end gap-2">
          <div>
            <label className={labelCls}>Иконка</label>
            <input className={`${inputClass()} w-16 text-center`} value={newIcon} onChange={(e) => setNewIcon(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className={labelCls}>Название площадки</label>
            <input className={inputClass()} value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addPlatform(); }} />
          </div>
          <button onClick={addPlatform} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5]">Добавить</button>
        </div>
      )}

      {brand && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">🎯 Общие правила бренда</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Описание компании</label>
              <textarea className={inputClass()} rows={3} value={brand.description} onChange={(e) => setBrand({ ...brand, description: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Чего избегать в контенте</label>
              <textarea className={inputClass()} rows={3} value={brand.avoid} onChange={(e) => setBrand({ ...brand, avoid: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Ключевые УТП (через запятую)</label>
              <input className={inputClass()} value={brand.utp} onChange={(e) => setBrand({ ...brand, utp: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Запрещённые слова</label>
              <input className={inputClass()} value={brand.forbidden_words} onChange={(e) => setBrand({ ...brand, forbidden_words: e.target.value })} />
            </div>
          </div>
          <button onClick={saveBrand} disabled={savingBrand} className="mt-4 px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">
            {savingBrand ? "Сохранение..." : "Сохранить правила бренда"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((p) => (
          <PlatformCard key={p.id} platform={p} reload={reload} />
        ))}
      </div>
    </div>
  );
}

function PlatformCard({ platform, reload }: { platform: CfPlatform; reload: () => Promise<void> }) {
  const [p, setP] = useState(platform);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setP(platform); setDirty(false); }, [platform]);

  const set = <K extends keyof CfPlatform>(key: K, value: CfPlatform[K]) => { setP((v) => ({ ...v, [key]: value })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try { await upsertPlatform(p); setDirty(false); await reload(); } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!confirm(`Удалить платформу «${p.name}»?`)) return;
    await deletePlatform(p.id); await reload();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{p.icon}</span>
        <div className="flex-1">
          <input className="text-sm font-semibold text-gray-900 bg-transparent outline-none w-full" value={p.name} onChange={(e) => set("name", e.target.value)} />
          <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadge[p.status]}`}>
            {CF_PLATFORM_STATUSES.find((s) => s.key === p.status)?.label}
          </span>
        </div>
        <button onClick={remove} className="text-[11px] text-red-400 hover:text-red-600">Удалить</button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Статус подключения</label>
          <Select value={p.status} onChange={(v) => set("status", v as CfPlatformStatus)} options={CF_PLATFORM_STATUSES.map((s) => ({ value: s.key, label: s.label }))} />
        </div>
        <div>
          <label className={labelCls}>Лимит символов</label>
          <input type="number" className={inputClass()} value={p.char_limit} onChange={(e) => set("char_limit", Number(e.target.value))} />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Формальность тона: {p.formality}/100</label>
        <input type="range" min={0} max={100} className="w-full accent-[#029cda]" value={p.formality} onChange={(e) => set("formality", Number(e.target.value))} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Уровень эмодзи</label>
          <Select value={String(p.emoji_level)} onChange={(v) => set("emoji_level", Number(v))}
            options={[{ value: "0", label: "Без эмодзи" }, { value: "1", label: "Минимум" }, { value: "2", label: "Умеренно" }, { value: "3", label: "Активно" }]} />
        </div>
        <div>
          <label className={labelCls}>Кол-во хэштегов</label>
          <input type="number" disabled={!p.hashtags} className={inputClass()} value={p.hashtag_count} onChange={(e) => set("hashtag_count", Number(e.target.value))} />
        </div>
      </div>

      <ToggleRow checked={p.hashtags} onChange={(v) => set("hashtags", v)} className="mb-3">Хэштеги</ToggleRow>

      <div className="mb-3">
        <label className={labelCls}>CTA (призыв к действию)</label>
        <input className={inputClass()} value={p.cta} onChange={(e) => set("cta", e.target.value)} />
      </div>
      <div className="mb-3">
        <label className={labelCls}>Инструкция для ИИ</label>
        <textarea className={inputClass()} rows={3} value={p.ai_prompt} onChange={(e) => set("ai_prompt", e.target.value)} />
      </div>
      <div className="mb-4">
        <label className={labelCls}>QA-комментарии</label>
        <input className={inputClass()} value={p.qa_notes} onChange={(e) => set("qa_notes", e.target.value)} placeholder="Особые проверки перед публикацией..." />
      </div>

      <button onClick={save} disabled={!dirty || saving} className="w-full px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-40">
        {saving ? "Сохранение..." : dirty ? "Сохранить изменения" : "Сохранено"}
      </button>
    </div>
  );
}
