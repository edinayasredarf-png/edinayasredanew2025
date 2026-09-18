"use client";

import React, { useState } from "react";

/** Иконка «?» с всплывающей подсказкой (стиль референса: тёмно-синий тултип сверху). */
export function HelpTip({ text, className = "" }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={`relative inline-flex align-middle ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Подсказка"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[11px] font-semibold leading-none hover:bg-gray-300 outline-none focus-visible:ring-2 focus-visible:ring-[#029cda]/40 transition-colors"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-[80vw] px-3 py-2 rounded-xl bg-[#1b2a4a] text-white text-xs leading-snug shadow-xl pointer-events-none"
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-[#1b2a4a]" />
        </span>
      )}
    </span>
  );
}
