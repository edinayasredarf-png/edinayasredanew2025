"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Select } from "@/components/admin/ui/Select";
import { inputClass } from "@/components/admin/ui/Field";
import { deletePlanItem, listPlanItems, upsertPlanItem } from "@/lib/contentFactoryStore";
import {
  CF_PLAN_STATUSES,
  CF_PLAN_TYPES,
  weekRange,
  type CfPlanItem,
  type CfPlanStatus,
  type CfPlanType,
  type CfPlatform,
} from "@/lib/contentFactoryTypes";

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function fmtWeekTitle(from: number, to: number): string {
  const f = new Date(from);
  const t = new Date(to - DAY_MS);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  return `${f.toLocaleDateString("ru-RU", opts)} — ${t.toLocaleDateString("ru-RU", opts)}`;
}
function dayLabel(ms: number): string {
  return new Date(ms).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
function typeColor(type: CfPlanType): string { return CF_PLAN_TYPES.find((t) => t.key === type)?.color ?? "#6b7280"; }
function timeOf(ms: number): string { return new Date(ms).toTimeString().slice(0, 5); }

export default function PlanTab({ platforms, onOpenInEditor }: { platforms: CfPlatform[]; onOpenInEditor: (planId: string) => void }) {
  const [anchor, setAnchor] = useState(Date.now());
  const { from, to } = useMemo(() => weekRange(anchor), [anchor]);
  const [items, setItems] = useState<CfPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState<{ date: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await listPlanItems({ from, to })); } finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => from + i * DAY_MS), [from]);
  const itemsForDay = (dayStart: number) => items.filter((it) => it.scheduled_at >= dayStart && it.scheduled_at < dayStart + DAY_MS).sort((a, b) => a.scheduled_at - b.scheduled_at);

  const remove = async (id: string) => { if (!confirm("Удалить публикацию из плана?")) return; await deletePlanItem(id); await load(); };
  const changeStatus = async (it: CfPlanItem, status: CfPlanStatus) => { await upsertPlanItem({ id: it.id, status }); await load(); };

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Контент-план</h2>
          <p className="text-sm text-gray-500">Расписание публикаций по неделям. Время указано локально.</p>
        </div>
        <button onClick={() => setShowAdd({ date: todayMs })} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5]">
          + Запланировать
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setAnchor((a) => a - 7 * DAY_MS)} className="px-3 py-1.5 rounded-xl text-sm bg-[#F6F7F9] text-gray-600 hover:text-gray-900">← Назад</button>
        <div className="flex-1 text-center text-sm font-semibold text-gray-800">{fmtWeekTitle(from, to)}</div>
        <button onClick={() => setAnchor((a) => a + 7 * DAY_MS)} className="px-3 py-1.5 rounded-xl text-sm bg-[#F6F7F9] text-gray-600 hover:text-gray-900">Вперёд →</button>
        <button onClick={() => setAnchor(Date.now())} className="px-3 py-1.5 rounded-xl text-sm bg-[#F6F7F9] text-gray-600 hover:text-gray-900">Сегодня</button>
      </div>

      {showAdd && (
        <QuickPlanForm platforms={platforms} initialDate={showAdd.date} onCancel={() => setShowAdd(null)}
          onSaved={async () => { setShowAdd(null); await load(); }} />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {days.map((d) => {
          const isToday = d === todayMs;
          return (
            <div key={d} className={`rounded-2xl border p-3 min-h-[160px] ${isToday ? "border-[#029cda] bg-[#029cda]/5" : "border-gray-100 bg-white"}`}>
              <div className="text-center mb-2">
                <p className="text-[11px] text-gray-400">{WEEKDAYS[Math.round((d - from) / DAY_MS)]}</p>
                <p className={`text-lg font-bold ${isToday ? "text-[#029cda]" : "text-gray-800"}`}>{new Date(d).getDate()}</p>
              </div>
              <div className="space-y-1.5">
                {itemsForDay(d).map((it) => (
                  <button key={it.id} onClick={() => onOpenInEditor(it.id)} className="w-full text-left rounded-lg px-2 py-1.5 text-[11px] bg-[#F6F7F9] hover:bg-gray-100" style={{ borderLeft: `3px solid ${typeColor(it.type)}` }}>
                    <p className="text-gray-700 leading-tight line-clamp-2">{it.title}</p>
                    <p className="text-gray-400 mt-0.5">{timeOf(it.scheduled_at)}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAdd({ date: d })} className="w-full mt-2 border border-dashed border-gray-200 rounded-lg py-1 text-[10px] text-gray-400 hover:border-[#029cda] hover:text-[#029cda]">+ добавить</button>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">📋 Список на этой неделе</h3>
        {loading && <p className="text-sm text-gray-400 py-4 text-center">Загрузка...</p>}
        {!loading && items.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">На этой неделе публикаций нет.</p>}
        <div className="divide-y divide-gray-100">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeColor(it.type) }} />
              <span className="text-gray-400 w-28 shrink-0">{dayLabel(it.scheduled_at)} · {timeOf(it.scheduled_at)}</span>
              <span className="flex-1 min-w-0 truncate text-gray-800">{it.title}</span>
              <span className="text-gray-400 text-xs shrink-0">{it.platforms.map((pid) => platforms.find((p) => p.id === pid)?.icon || pid).join(" ")}</span>
              <Select value={it.status} onChange={(v) => changeStatus(it, v as CfPlanStatus)} className="w-36 shrink-0" options={CF_PLAN_STATUSES.map((s) => ({ value: s.key, label: s.label }))} />
              <button onClick={() => onOpenInEditor(it.id)} className="text-[#029cda] text-xs font-semibold shrink-0">Открыть</button>
              <button onClick={() => remove(it.id)} className="text-red-400 hover:text-red-600 text-xs shrink-0">Удалить</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickPlanForm({ platforms, initialDate, onCancel, onSaved }: {
  platforms: CfPlatform[];
  initialDate: number;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CfPlanType>("post");
  const [date, setDate] = useState(new Date(initialDate).toISOString().slice(0, 10));
  const [time, setTime] = useState("12:00");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    if (!title.trim()) { setError("Укажите заголовок"); return; }
    setSaving(true); setError("");
    try {
      const scheduled_at = new Date(`${date}T${time}:00`).getTime();
      await upsertPlanItem({ title: title.trim(), type, scheduled_at, platforms: selected, status: "draft" });
      await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#F6F7F9] rounded-2xl border border-[#e8eaed] p-5 mb-6">
      <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">+ Добавить в план</h3>
      {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
        <div className="sm:col-span-2">
          <label className="block text-[13px] font-medium text-[#52555a] mb-1">Заголовок</label>
          <input className={inputClass()} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#52555a] mb-1">Тип</label>
          <Select value={type} onChange={(v) => setType(v as CfPlanType)} options={CF_PLAN_TYPES.map((t) => ({ value: t.key, label: t.label }))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[13px] font-medium text-[#52555a] mb-1">Дата</label>
            <input type="date" className={inputClass()} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-[#52555a] mb-1">Время</label>
            <input type="time" className={inputClass()} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[13px] font-medium text-[#52555a] mb-1">Платформы</label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button key={p.id} type="button" onClick={() => toggle(p.id)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${selected.includes(p.id) ? "bg-[#029cda] text-white border-[#029cda]" : "border-gray-200 text-gray-600"}`}>
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-[#029cda] text-white text-sm font-semibold rounded-xl hover:bg-[#0280b5] disabled:opacity-60">{saving ? "Сохранение..." : "Добавить"}</button>
        <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Отмена</button>
      </div>
    </div>
  );
}
