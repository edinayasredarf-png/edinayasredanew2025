"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const WEEKDAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function parseIso(v: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
}
function fmtRu(v: string): string {
  const p = parseIso(v);
  return p ? `${String(p.d).padStart(2, "0")}.${String(p.m + 1).padStart(2, "0")}.${p.y}` : "";
}

/** Кастомный выбор даты (ISO YYYY-MM-DD) в стиле референса. */
export function DatePicker({ value, onChange, placeholder = "Выберите дату", className = "" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  const sel = parseIso(value);
  const [view, setView] = useState({ y: sel?.y ?? today.getFullYear(), m: sel?.m ?? today.getMonth() });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const lead = (first.getDay() + 6) % 7; // Пн=0
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const arr: Array<{ d: number } | null> = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push({ d });
    return arr;
  }, [view]);

  const step = (delta: number) => setView((v) => {
    const nm = v.m + delta;
    return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
  });

  const isToday = (d: number) => today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;
  const isSel = (d: number) => sel && sel.y === view.y && sel.m === view.m && sel.d === d;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 rounded-xl border text-sm text-left bg-white outline-none transition-colors ${open ? "border-[#029cda] ring-2 ring-[#029cda]/15" : "border-gray-200 hover:border-gray-300"}`}
      >
        <span className={value ? "text-[#1b2a4a]" : "text-gray-400"}>{value ? fmtRu(value) : placeholder}</span>
        <svg className="w-4 h-4 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="none" aria-hidden>
          <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 8h14M7 3v3M13 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 left-0 mt-1 w-[280px] bg-white border border-gray-200 rounded-2xl shadow-xl p-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <button type="button" onClick={() => step(-1)} aria-label="Предыдущий месяц" className="w-7 h-7 grid place-items-center rounded-lg text-gray-500 hover:bg-gray-100">‹</button>
            <div className="text-sm font-semibold text-[#1b2a4a]">{MONTHS[view.m]} {view.y}</div>
            <button type="button" onClick={() => step(1)} aria-label="Следующий месяц" className="w-7 h-7 grid place-items-center rounded-lg text-gray-500 hover:bg-gray-100">›</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((w) => <div key={w} className="h-7 grid place-items-center text-[11px] text-gray-400">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((c, i) => c === null ? <div key={i} /> : (
              <button
                key={i}
                type="button"
                onClick={() => { onChange(toIso(view.y, view.m, c.d)); setOpen(false); }}
                className={`h-8 grid place-items-center rounded-lg text-sm transition-colors ${
                  isSel(c.d) ? "bg-[#029cda] text-white font-medium"
                  : isToday(c.d) ? "text-[#029cda] font-medium hover:bg-[#EAF6FC]"
                  : "text-[#1b2a4a] hover:bg-gray-100"
                }`}
              >
                {c.d}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <button type="button" onClick={() => { onChange(toIso(today.getFullYear(), today.getMonth(), today.getDate())); setOpen(false); }} className="text-xs text-[#029cda] hover:text-[#0280b5]">Сегодня</button>
            {value && <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-xs text-gray-400 hover:text-gray-600">Очистить</button>}
          </div>
        </div>
      )}
    </div>
  );
}
