"use client";

import React, { useEffect, useRef, useState } from "react";

export interface MultiOption { value: string; label: string; sub?: string }

/** Мультивыбор в выпадающем списке с чекбоксами (стиль референса). */
export function MultiSelect({
  value, onChange, options, placeholder = "Выберите…", allLabel = "Все", searchable,
  className = "", disabled, ariaLabel,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: MultiOption[];
  placeholder?: string;
  allLabel?: string;
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

  const filtered = searchable && q ? options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : options;
  const allSelected = options.length > 0 && value.length === options.length;
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const toggleAll = () => onChange(allSelected ? [] : options.map((o) => o.value));

  const summary = value.length === 0
    ? placeholder
    : allSelected
      ? allLabel
      : value.length <= 2
        ? options.filter((o) => value.includes(o.value)).map((o) => o.label).join(", ")
        : `Выбрано: ${value.length}`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 rounded-xl border text-sm text-left bg-white outline-none transition-colors focus-visible:border-[#029cda] focus-visible:ring-2 focus-visible:ring-[#029cda]/25 ${open ? "border-[#029cda] ring-2 ring-[#029cda]/15" : "border-gray-200 hover:border-[#029cda]"} disabled:opacity-50`}
      >
        <span className={`truncate ${value.length ? "text-[#1b2a4a]" : "text-gray-400"}`}>{summary}</span>
        <svg className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden" role="listbox" aria-multiselectable>
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
          {options.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left border-b border-gray-100 hover:bg-gray-50"
            >
              <Checkbox checked={allSelected} />
              <span className="font-medium text-[#1b2a4a]">{allSelected ? "Снять все" : "Выбрать все"}</span>
            </button>
          )}
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">Ничего не найдено</div>}
            {filtered.map((o) => {
              const checked = value.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggle(o.value)}
                  className="w-full flex items-start gap-3 px-3 py-2 text-sm text-left hover:bg-gray-50"
                >
                  <Checkbox checked={checked} className="mt-0.5" />
                  <span className="min-w-0">
                    <span className={`block ${checked ? "font-medium text-[#0b5c7d]" : "text-[#1b2a4a]"}`}>{o.label}</span>
                    {o.sub && <span className="block text-xs text-gray-500 mt-0.5">{o.sub}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Checkbox({ checked, className = "" }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center border transition-colors ${checked ? "bg-[#029cda] border-[#029cda]" : "bg-white border-gray-300"} ${className}`}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M5 10l3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
