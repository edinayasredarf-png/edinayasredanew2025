"use client";

/**
 * Единый спиннер админки в фирменном цвете #029cda.
 * Стиль совпадает с загрузчиками в других разделах (animate-spin + border-b-2).
 */
export function Spinner({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className={`animate-spin rounded-full border-b-2 border-[#029cda] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Блок-заглушка на месте текста «Загрузка…»: крутящийся спиннер по центру. */
export function LoadingBlock({ label, size = 28, className = "" }: { label?: string; size?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-8 text-gray-500 ${className}`}>
      <Spinner size={size} />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
