"use client";

import React, { useEffect, useRef, useState } from "react";

export interface SelectOption { value: string; label: string }

/** Кастомный выпадающий список в стиле референса: белая панель, скругления, поиск. */
export function Select({
  value, onChange, options, placeholder = "Выберите…", searchable, className = "", disabled, ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = searchable && q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 rounded-xl border text-sm text-left bg-white outline-none transition-colors focus-visible:border-[#029cda] focus-visible:ring-2 focus-visible:ring-[#029cda]/25 ${open ? "border-[#029cda] ring-2 ring-[#029cda]/15" : "border-gray-200 hover:border-gray-300"} disabled:opacity-50`}
      >
        <span className={`truncate ${selected ? "text-[#1b2a4a]" : "text-gray-400"}`}>{selected?.label || placeholder}</span>
        <svg className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden" role="listbox">
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск…"
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#029cda] focus:ring-2 focus:ring-[#029cda]/15"
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">Ничего не найдено</div>}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => { onChange(o.value); setOpen(false); setQ(""); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${o.value === value ? "bg-[#EAF6FC] text-[#0b5c7d] font-medium" : "text-[#1b2a4a] hover:bg-gray-50"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
