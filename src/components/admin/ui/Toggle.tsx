"use client";

import React from "react";

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

/** Кликабельная строка «свитч + подпись». Тоглит по клику на всю строку. */
export function ToggleRow({ checked, onChange, disabled, children, className = "" }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 text-left text-sm text-[#313131] disabled:opacity-50 ${className}`}
    >
      <Switch checked={checked} disabled={disabled} />
      <span className="min-w-0">{children}</span>
    </button>
  );
}
