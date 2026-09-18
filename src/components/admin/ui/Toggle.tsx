"use client";

import React from "react";
import { HelpTip } from "./HelpTip";

/** Пилюля-переключатель (свитч) в стиле референса: бирюзовый трек + белый бегунок. */
export function Switch({ checked, disabled, "aria-label": ariaLabel }: {
  checked: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-[#029cda]" : "bg-gray-300"} ${disabled ? "opacity-50" : ""}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </span>
  );
}

/** Кликабельная строка «свитч + подпись». Тоглит по клику на всю строку.
 *  bordered — вариант-карточка в окантовке (подпись слева, свитч справа), как в референсе. */
export function ToggleRow({ checked, onChange, disabled, children, hint, bordered, className = "" }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
  hint?: string;
  bordered?: boolean;
  className?: string;
}) {
  const toggleBtn = (labelText: React.ReactNode) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-left disabled:opacity-50"
    >
      <Switch checked={checked} disabled={disabled} />
      {labelText != null && <span className="min-w-0">{labelText}</span>}
    </button>
  );

  if (bordered) {
    // Карточка в окантовке: подпись слева, свитч справа. Кнопкой является только сам свитч
    // (иначе получилась бы кнопка внутри кнопки вместе с «?»).
    return (
      <div className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-[#1b2a4a] transition-colors hover:border-[#029cda] ${className}`}>
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <span className="min-w-0">{children}</span>
          {hint && <HelpTip text={hint} />}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className="shrink-0 disabled:opacity-50"
          aria-label={typeof children === "string" ? children : "Переключатель"}
        >
          <Switch checked={checked} disabled={disabled} />
        </button>
      </div>
    );
  }

  if (hint) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm text-[#313131] ${className}`}>
        {toggleBtn(children)}
        <HelpTip text={hint} />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center text-sm text-[#313131] ${className}`}>
      {toggleBtn(children)}
    </span>
  );
}
