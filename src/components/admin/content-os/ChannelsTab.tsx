"use client";

import React, { useEffect, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import { ToggleRow } from "@/components/admin/ui/Toggle";
import { upsertChannel } from "@/lib/contentOsStore";
import { CHANNEL_PROFILE_STATUSES, type ChannelProfileStatus, type ContentChannelProfile } from "@/lib/contentOsTypes";

const labelCls = "block text-[13px] font-medium text-[#52555a] mb-1";
const statusBadge: Record<ChannelProfileStatus, string> = {
  connected: "bg-green-50 text-green-700",
  setup: "bg-amber-50 text-amber-700",
  manual: "bg-gray-100 text-gray-600",
  planned: "bg-sky-50 text-sky-700",
};

export default function ChannelsTab({ channels, reload }: { channels: ContentChannelProfile[]; reload: () => Promise<void> }) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Каналы</h2>
        <p className="text-sm text-gray-500">Ограничения, тон и обязательные элементы для каждой площадки — используются при генерации.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((c) => <ChannelCard key={c.id} channel={c} reload={reload} />)}
      </div>
    </div>
  );
}

function ChannelCard({ channel, reload }: { channel: ContentChannelProfile; reload: () => Promise<void> }) {
  const [c, setC] = useState(channel);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setC(channel); setDirty(false); }, [channel]);

  const set = <K extends keyof ContentChannelProfile>(key: K, value: ContentChannelProfile[K]) => { setC((v) => ({ ...v, [key]: value })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try { await upsertChannel(c); setDirty(false); await reload(); } finally { setSaving(false); }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-semibold text-gray-900">{c.name}</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadge[c.status]}`}>
          {CHANNEL_PROFILE_STATUSES.find((s) => s.key === c.status)?.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Статус подключения</label>
          <Select value={c.status} onChange={(v) => set("status", v as ChannelProfileStatus)} options={CHANNEL_PROFILE_STATUSES.map((s) => ({ value: s.key, label: s.label }))} />
        </div>
        <div>
          <label className={labelCls}>Лимит символов</label>
          <input type="number" className={inputClass()} value={c.char_limit} onChange={(e) => set("char_limit", Number(e.target.value))} />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>Формальность тона: {c.formality}/100</label>
        <input type="range" min={0} max={100} className="w-full accent-[#029cda]" value={c.formality} onChange={(e) => set("formality", Number(e.target.value))} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>Уровень эмодзи</label>
          <Select value={String(c.emoji_level)} onChange={(v) => set("emoji_level", Number(v))}
            options={[{ value: "0", label: "Без эмодзи" }, { value: "1", label: "Минимум" }, { value: "2", label: "Умеренно" }, { value: "3", label: "Активно" }]} />
        </div>
        <div>
          <label className={labelCls}>Кол-во хэштегов</label>
          <input type="number" disabled={!c.hashtags} className={inputClass()} value={c.hashtag_count} onChange={(e) => set("hashtag_count", Number(e.target.value))} />
        </div>
      </div>

      <ToggleRow checked={c.hashtags} onChange={(v) => set("hashtags", v)} className="mb-3">Хэштеги</ToggleRow>

      <div className="mb-3">
        <label className={labelCls}>CTA</label>
        <input className={inputClass()} value={c.cta} onChange={(e) => set("cta", e.target.value)} />
      </div>
      <div className="mb-4">
        <label className={labelCls}>Инструкция для ИИ</label>
        <textarea className={inputClass()} rows={3} value={c.ai_prompt} onChange={(e) => set("ai_prompt", e.target.value)} />
      </div>

      <button onClick={save} disabled={!dirty || saving} className="w-full px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-40">
        {saving ? "Сохранение..." : dirty ? "Сохранить изменения" : "Сохранено"}
      </button>
    </div>
  );
}
