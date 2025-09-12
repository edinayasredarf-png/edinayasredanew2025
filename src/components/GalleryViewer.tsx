'use client';
import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useGallery } from './GalleryProvider';

/**
 * Полноэкранный просмотрщик:
 * - Белые «каплевидные» стрелки снизу по центру (как в вашем примере со Swiper)
 * - Кнопка закрытия (крестик) ВСЕГДА поверх (max z-index)
 * - Esc / клики по фону закрывают
 * - Листание стрелками клавиатуры
 */
const GalleryViewer: React.FC = () => {
  const { isOpen, items, index, close, next, prev } = useGallery();
  const backdropRef = useRef<HTMLDivElement>(null);

  // клавиатура
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close, next, prev]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/90"
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) close();
      }}
      aria-modal="true"
      role="dialog"
    >
      {/* Кнопка закрытия — самый верхний слой */}
      <button
        type="button"
        onClick={close}
        aria-label="Закрыть"
        className="fixed top-4 right-4 z-[10000] inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 hover:bg-white
                   shadow-lg transition outline-none focus-visible:ring-2 focus-visible:ring-[#0077FF]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Изображение по центру */}
      <div className="relative w-[92vw] max-w-[1200px] h-[78vh]">
        {items[index] && (
          <Image
            src={items[index].src}
            alt={items[index].alt || ''}
            fill
            className="object-contain select-none"
            sizes="(max-width: 1200px) 92vw, 1200px"
            priority
          />
        )}
      </div>

      {/* Навигация снизу по центру — как в вашем примере */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9995] flex items-center gap-0">
        <button
          type="button"
          aria-label="Предыдущий слайд"
          onClick={prev}
          className="w-[50px] h-[60px] bg-[#0077FF] rounded-tl-[50px] rounded-bl-[50px] flex items-center justify-center hover:bg-[#0077FF]/90 transition"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Следующий слайд"
          onClick={next}
          className="w-[50px] h-[60px] bg-[#0077FF] rounded-tr-[50px] rounded-br-[50px] flex items-center justify-center hover:bg-[#0077FF]/90 transition"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
};

export default GalleryViewer;
