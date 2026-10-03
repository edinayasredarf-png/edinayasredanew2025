"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { inputClass } from "@/components/admin/ui/Field";
import { listItemsByChannel, listPlan, upsertItem } from "@/lib/contentOsStore";
import { CONTENT_OS_CHANNELS, type ContentItemWithCluster, type ContentOsChannel } from "@/lib/contentOsTypes";

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function weekRange(anchor: number): { from: number; to: number } {
  const d = new Date(anchor);
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day).getTime();
  return { from: monday, to: monday + 7 * DAY_MS };
}
function fmtWeekTitle(from: number, to: number): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
  return `${new Date(from).toLocaleDateString("ru-RU", opts)} — ${new Date(to - DAY_MS).toLocaleDateString("ru-RU", opts)}`;
}
const channelColor = (ch: ContentOsChannel) => ({ article: "#029cda", telegram: "#38bdf8", vk: "#0ea5e9", dzen: "#f59e0b", max: "#8b5cf6" })[ch];
const timeOf = (ms: number) => new Date(ms).toTimeString().slice(0, 5);

export default function ContentPlanTab({ onOpenCluster }: { onOpenCluster: (clusterId: string) => void }) {
  const [anchor, setAnchor] = useState(Date.now());
  const { from, to } = useMemo(() => weekRange(anchor), [anchor]);
  const [items, setItems] = useState<ContentItemWithCluster[]>([]);
  const [unscheduled, setUnscheduled] = useState<ContentItemWithCluster[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduled, all] = await Promise.all([listPlan(from, to), listItemsByChannel(CONTENT_OS_CHANNELS.map((c) => c.key))]);
      setItems(scheduled);
      setUnscheduled(all.filter((i) => i.status === "approved" && !i.scheduled_at));
    } finally {
      setLoading(false);
    }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => from + i * DAY_MS), [from]);
  const itemsForDay = (day: number) => items.filter((i) => i.scheduled_at && i.scheduled_at >= day && i.scheduled_at < day + DAY_MS);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">Контент-план</h2>
        <p className="text-sm text-gray-500">Календарь публикаций по всем каналам (§44 ТЗ). Планировать можно только утверждённые материалы.</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setAnchor((a) => a - 7 * DAY_MS)} className="px-3 py-1.5 rounded-xl text-sm bg-[#F6F7F9] text-gray-600 hover:text-gray-900">← Назад</button>
        <div className="flex-1 text-center text-sm font-semibold text-gray-800">{fmtWeekTitle(from, to)}</div>
        <button onClick={() => setAnchor((a) => a + 7 * DAY_MS)} className="px-3 py-1.5 rounded-xl text-sm bg-[#F6F7F9] text-gray-600 hover:text-gray-900">Вперёд →</button>
        <button onClick={() => setAnchor(Date.now())} className="px-3 py-1.5 rounded-xl text-sm bg-[#F6F7F9] text-gray-600 hover:text-gray-900">Сегодня</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
                    <button key={it.id} onClick={() => onOpenCluster(it.cluster_id)} className="w-full text-left rounded-lg px-2 py-1.5 text-[11px] bg-[#F6F7F9] hover:bg-gray-100" style={{ borderLeft: `3px solid ${channelColor(it.channel)}` }}>
                      <p className="text-gray-700 leading-tight line-clamp-2">{it.title || it.cluster_title}</p>
                      <p className="text-gray-400 mt-0.5">{timeOf(it.scheduled_at!)} · {CONTENT_OS_CHANNELS.find((c) => c.key === it.channel)?.icon}</p>
                    </button>
                  ))}
                  {itemsForDay(d).length === 0 && !loading && <p className="text-[10px] text-gray-300 text-center py-4">—</p>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 h-fit">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Готово к планированию</h3>
          <div className="space-y-2">
            {unscheduled.length === 0 && <p className="text-xs text-gray-400">Утверждённых материалов без даты нет.</p>}
            {unscheduled.map((it) => <SchedulePicker key={it.id} item={it} onScheduled={load} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SchedulePicker({ item, onScheduled }: { item: ContentItemWithCluster; onScheduled: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("12:00");
  const [busy, setBusy] = useState(false);

  const schedule = async () => {
    setBusy(true);
    try {
      const scheduled_at = new Date(`${date}T${time}:00`).getTime();
      await upsertItem({ id: item.id, cluster_id: item.cluster_id, channel: item.channel, scheduled_at, status: "scheduled" });
      onScheduled();
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-[#F6F7F9] rounded-xl p-2.5">
      <p className="text-xs font-medium text-gray-800 truncate">{CONTENT_OS_CHANNELS.find((c) => c.key === item.channel)?.icon} {item.title || item.cluster_title}</p>
      <div className="flex gap-1 mt-1.5">
        <input type="date" className={`${inputClass()} text-xs px-2 py-1`} value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="time" className={`${inputClass()} text-xs px-2 py-1 w-20`} value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <button onClick={schedule} disabled={busy} className="w-full mt-1.5 px-2 py-1 bg-[#029cda] text-white text-[11px] font-semibold rounded-lg disabled:opacity-60">
        {busy ? "..." : "Запланировать"}
      </button>
    </div>
  );
}
