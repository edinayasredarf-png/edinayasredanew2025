import React, { ReactNode } from "react";

interface AnswerBoxProps {
  /** Короткая метка над ответом, напр. «Кратко» или «Ответ» */
  label?: string;
  children: ReactNode;
}

/**
 * Выделенный блок с прямым ответом на запрос.
 * Размещается сразу после H1 — извлекаемый пассаж для ИИ-поиска (GEO).
 */
export default function AnswerBox({ label = "Кратко", children }: AnswerBoxProps) {
  return (
    <div className="rounded-3xl border-l-4 border-[#029cda] bg-[#F0F9FE] p-6 md:p-8 max-w-3xl">
      <div className="text-xs md:text-sm font-semibold uppercase tracking-wide text-[#029cda] mb-3">
        {label}
      </div>
      <div className="text-gray-800 text-base md:text-lg leading-relaxed">
        {children}
      </div>
    </div>
  );
}
