"use client";

import React from "react";
import { HelpTip } from "./HelpTip";

/** Канонический класс поля ввода в стиле референса: белый фон, окантовка,
 *  hover/focus — бирюзовый #029cda, ошибка — красный. */
export function inputClass(error?: boolean, extra = "") {
  const base =
    "w-full px-3 py-2 rounded-xl border bg-white text-sm text-[#313131] placeholder:text-gray-400 outline-none transition-colors";
  const state = error
    ? "border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
    : "border-gray-200 hover:border-[#029cda] focus:border-[#029cda] focus:ring-2 focus:ring-[#029cda]/15";
  return `${base} ${state} ${extra}`.trim();
}

/** Обёртка поля: подпись (+ опц. подсказка «?»), контент и сообщение об ошибке снизу. */
export function Field({
  label, hint, error, required, htmlFor, children, className = "",
}: {
  label?: React.ReactNode;
  hint?: string;
  error?: string | null;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label != null && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <label htmlFor={htmlFor} className="text-sm font-medium text-[#1b2a4a]">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
          {hint && <HelpTip text={hint} />}
        </div>
      )}
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/** Текстовое поле с каноническим стилем и поддержкой состояния ошибки. */
export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(function TextInput({ error, className = "", ...props }, ref) {
  return <input ref={ref} className={inputClass(error, className)} {...props} />;
});

/** Многострочное поле с каноническим стилем. */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(function Textarea({ error, className = "", ...props }, ref) {
  return <textarea ref={ref} className={inputClass(error, className)} {...props} />;
});
