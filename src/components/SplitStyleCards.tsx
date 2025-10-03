'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Card = { title: string; subtitle: string; image: string };

const DEFAULT_CARDS: Card[] = [
  { title: 'Контролируйте работы удалённо', subtitle: 'Подрядчики сами вносят данные — вы принимаете работы онлайн', image: '/img/card1.webp' },
  { title: 'Актуальные данные 24/7',        subtitle: 'Реестры всегда под рукой — для отчетов и проверок',        image: '/img/card2.webp' },
  { title: 'ГИС-платформа для всех данных',  subtitle: 'Объекты с координатами, границами, атрибутами на карте',   image: '/img/card3.webp' },
  { title: 'Прозрачность действий',          subtitle: 'Отслеживайте все изменения в системе',                     image: '/img/card4.webp' },
  { title: 'Настраивайте доступы',           subtitle: 'Гибко управляйте правами: администраторы, проверяющие, подрядчики', image: '/img/card5.webp' },
];

const usePrefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const FeaturesCarousel: React.FC<{ items?: Card[]; initial?: number }> = ({ items = DEFAULT_CARDS, initial = 0 }) => {
  const [index, setIndex] = useState(clamp(initial, 0, items.length - 1));
  const trackRef = useRef<HTMLDivElement | null>(null);
  const prefersReduced = usePrefersReducedMotion();

  // --- Keyboard: ← / → ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => clamp(i + 1, 0, items.length - 1));
      if (e.key === 'ArrowLeft')  setIndex((i) => clamp(i - 1, 0, items.length - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

  // --- Wheel to step cards (vertical → horizontal intent) ---
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // respect real horizontal scrolling
      if (e.deltaY > 8)  { setIndex((i) => clamp(i + 1, 0, items.length - 1)); e.preventDefault(); }
      if (e.deltaY < -8) { setIndex((i) => clamp(i - 1, 0, items.length - 1)); e.preventDefault(); }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as any);
  }, [items.length]);

  // --- Touch swipe (mobile) ---
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let startX = 0, startY = 0, active = false;
    const onTouchStart = (e: TouchEvent) => { const t = e.touches[0]; startX = t.clientX; startY = t.clientY; active = true; };
    const onTouchMove  = (e: TouchEvent) => {
      if (!active) return;
      const t = e.touches[0]; const dx = t.clientX - startX; const dy = t.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24) {
        if (dx < 0) setIndex((i) => clamp(i + 1, 0, items.length - 1));
        else        setIndex((i) => clamp(i - 1, 0, items.length - 1));
        active = false;
      }
    };
    const onTouchEnd = () => { active = false; };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: true });
    el.addEventListener('touchend',   onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove',  onTouchMove as any);
      el.removeEventListener('touchend',   onTouchEnd as any);
    };
  }, [items.length]);

  // --- Mouse swipe (desktop via Pointer Events) ---
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let startX = 0, startY = 0, dragging = false, moved = false;
    let pointerId: number | null = null;

    const setDraggingClass = (on: boolean) => {
      if (!el) return;
      if (on) el.classList.add('cursor-grabbing', 'select-none');
      else    el.classList.remove('cursor-grabbing', 'select-none');
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // only left click
      pointerId = e.pointerId;
      (e.target as Element).setPointerCapture?.(pointerId);
      startX = e.clientX; startY = e.clientY;
      dragging = true; moved = false;
      setDraggingClass(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      // горизонтальный жест
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 36) {
        if (dx < 0) setIndex((i) => clamp(i + 1, 0, items.length - 1));
        else        setIndex((i) => clamp(i - 1, 0, items.length - 1));
        // сбрасываем жест, чтобы за одно перетаскивание был один шаг
        dragging = false;
        setDraggingClass(false);
        pointerId = null;
      }
    };

    const end = (e: PointerEvent) => {
      if (pointerId != null) (e.target as Element).releasePointerCapture?.(pointerId);
      dragging = false; pointerId = null;
      setDraggingClass(false);
    };

    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);

    // курсор «рука» по умолчанию
    el.classList.add('cursor-grab');

    return () => {
      el.removeEventListener('pointerdown', onPointerDown as any);
      el.removeEventListener('pointermove', onPointerMove as any);
      el.removeEventListener('pointerup', end as any);
      el.removeEventListener('pointercancel', end as any);
      el.removeEventListener('pointerleave', end as any);
      el.classList.remove('cursor-grab', 'cursor-grabbing', 'select-none');
    };
  }, [items.length]);

  const go = (next: number) => setIndex(clamp(next, 0, items.length - 1));

  return (
    <section className="relative w-full bg-[#F6F7F9] py-10 md:py-14">
      <div className="mx-auto w-[92vw] max-w-[1120px]">
        <header className="text-center px-4">
          <h2 className="text-black font-bold leading-[1.1] text-[30px] md:text-[44px]">
            Все возможности в одном месте
          </h2>
          <p className="mt-2 text-black/60 text-base md:text-xl">
					Управляйте городскими данными, контролем работ и отчетностью — онлайн и без лишних движений.

</p>
        </header>

        {/* карточка */}
        <div className="relative mt-6 md:mt-8" ref={trackRef}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={index}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -24 }}
              transition={{ type: prefersReduced ? 'tween' : 'spring', stiffness: 180, damping: 24, mass: 0.7, duration: prefersReduced ? 0.18 : undefined }}
              className="relative w-full rounded-3xl bg-white border border-[#E7ECF4] overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 md:[aspect-ratio:2/1]" style={{ minHeight: 320 }}>
                <div className="flex items-center">
                  <div className="px-6 py-8 md:px-10 md:py-10">
                    <h3 className="text-black font-semibold leading-[1.15] text-[22px] sm:text-[26px] md:text-[32px]">
                      {items[index].title}
                    </h3>
                    <p className="mt-4 text-black/70 leading-snug text-[15px] sm:text-[16px] md:text-[18px]">
                      {items[index].subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-end justify-center px-2 pt-2 pb-4 md:px-2 md:pt-2 md:pb-6">
                  <img
                    src={items[index].image}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="w-full h-full object-contain object-bottom pointer-events-none select-none"
                  />
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        {/* индикаторы-точки */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`К карточке ${i + 1}`}
              className={`h-2.5 rounded-full transition-[width,opacity] ${i === index ? 'w-6 bg-black' : 'w-2.5 bg-black/25'}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesCarousel;
