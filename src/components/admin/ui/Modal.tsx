'use client';

import React, { useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';

/** Универсальное модальное окно: клик по фону/Esc — закрыть, клик внутри — не закрывает. */
export function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind-класс максимальной ширины окна (по умолчанию max-w-lg). */
  maxWidth?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${maxWidth} my-8 p-6 space-y-4`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#1b2a4a]">{title}</h3>
          <button type="button" onClick={onClose} title="Закрыть" className="shrink-0 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Строка раздела настроек: иконка + заголовок + подпись + шеврон. Клик открывает модалку. */
export function SettingsRow({ icon, title, subtitle, onClick }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-gray-100 hover:border-[#029cda]/40 hover:bg-[#FAFDFF] transition text-left">
      <span className="shrink-0 size-10 rounded-full bg-[#F6F7F9] grid place-items-center text-[#1b2a4a]">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-[#1b2a4a]">{title}</span>
        {subtitle && <span className="block text-xs text-gray-400 truncate">{subtitle}</span>}
      </span>
      <ChevronRight className="shrink-0 w-4 h-4 text-gray-300" />
    </button>
  );
}
