'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Card = { title: string; subtitle: string; image: string };

const DEFAULT_CARDS: Card[] = [
  { title: 'Контролируйте работы удалённо', subtitle: 'Подрядчики сами вносят данные — вы принимаете работы онлайн', image: '/img/card1.webp' },
  { title: 'Актуальные данные 24/7',        subtitle: 'Реестры всегда под рукой — для отчетов и проверок',        image: '/img/card2.webp' },
  { title: 'ГИС-платформа для всех данных',  subtitle: 'Объекты с координатами, границами, атрибутами на карте',   image: '/img/card3.webp' },
  { title: 'Прозрачность действий',          subtitle: 'Отслеживайте все изменения в системе',                     image: '/img/card4.webp' },
  { title: 'Настраивайте доступы',           subtitle: 'Гибко управляйте правами: администраторы, проверяющие, подрядчики', image: '/img/card5.webp' },
];

const DRAG_TOUCH_THRESHOLD = 24;
const DRAG_MOUSE_THRESHOLD = 36;
const WHEEL_COOLDOWN_MS = 240;
const WHEEL_MIN_DELTA_PX = 28;
const AUTOPLAY_INTERVAL_MS = 10000;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const pxFromWheel = (e: WheelEvent) =>
  e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function usePreloadNeighbors(items: Card[], index: number) {
  useEffect(() => {
    const preload = (src?: string) => { if (!src) return; const img = new Image(); img.src = src; /* @ts-ignore */ img.decode?.().catch(() => {}); };
    if (!items.length) return;
    preload(items[(index + 1) % items.length]?.image);
    preload(items[(index - 1 + items.length) % items.length]?.image);
  }, [items, index]);
}

export interface FeaturesCarouselProps {
  items?: Card[];
  initial?: number;
  autoplay?: boolean;
  intervalMs?: number;
  onChange?: (nextIndex: number) => void;
  renderCTA?: (item: Card) => React.ReactNode;
}

const FeaturesCarousel: React.FC<FeaturesCarouselProps> = ({
  items = DEFAULT_CARDS,
  initial = 0,
  autoplay = true,
  intervalMs = AUTOPLAY_INTERVAL_MS,
  onChange,
  renderCTA,
}) => {
  const len = items.length || 1;
  const [index, setIndex] = useState(clamp(initial, 0, len - 1));
  const prefersReduced = usePrefersReducedMotion();

  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(true);
  const lastInteractTs = useRef(0);

  const go = useCallback((next: number) => {
    const normalized = ((next % len) + len) % len;
    setIndex(normalized);
    onChange?.(normalized);
  }, [len, onChange]);

  const next = useCallback(() => { go(index + 1); lastInteractTs.current = Date.now(); }, [go, index]);
  const prev = useCallback(() => { go(index - 1); lastInteractTs.current = Date.now(); }, [go, index]);

  const onNextRef = useRef(() => {});
  const onPrevRef = useRef(() => {});
  onNextRef.current = next;
  onPrevRef.current = prev;

  usePreloadNeighbors(items, index);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.location.hash.match(/^#f(\d{1,3})$/i);
    if (m) {
      const idx = clamp(parseInt(m[1], 10) - 1, 0, len - 1);
      if (!Number.isNaN(idx)) setIndex(idx);
    }
  }, [len]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = `#f${index + 1}`;
    if (window.location.hash !== target) window.history?.replaceState?.(null, '', target);
  }, [index]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement !== trackRef.current) return;
      if (e.key === 'ArrowRight') onNextRef.current();
      if (e.key === 'ArrowLeft')  onPrevRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let locked = false;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const dy = pxFromWheel(e);
      if (Math.abs(dy) < WHEEL_MIN_DELTA_PX || locked) return;
      e.preventDefault();
      locked = true;
      dy > 0 ? onNextRef.current() : onPrevRef.current();
      const t = window.setTimeout(() => { locked = false; window.clearTimeout(t); }, WHEEL_COOLDOWN_MS);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel as any);
  }, []);

  useEffect(() => {
    const el = trackRef.current; if (!el) return;
    let startX = 0, startY = 0, active = false;
    const onTouchStart = (e: TouchEvent) => { const t = e.touches[0]; startX = t.clientX; startY = t.clientY; active = true; };
    const onTouchMove  = (e: TouchEvent) => {
      if (!active) return;
      const t = e.touches[0], dx = t.clientX - startX, dy = t.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_TOUCH_THRESHOLD) {
        dx < 0 ? onNextRef.current() : onPrevRef.current();
        lastInteractTs.current = Date.now();
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
  }, []);

  useEffect(() => {
    const el = trackRef.current; if (!el) return;
    let startX = 0, startY = 0, dragging = false, pointerId: number | null = null;
    const setDraggingClass = (on: boolean) => { el.classList.toggle('cursor-grabbing', on); el.classList.toggle('select-none', on); };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerId = e.pointerId; (e.target as Element).setPointerCapture?.(pointerId);
      startX = e.clientX; startY = e.clientY; dragging = true; setDraggingClass(true);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_MOUSE_THRESHOLD) {
        dx < 0 ? onNextRef.current() : onPrevRef.current();
        lastInteractTs.current = Date.now(); dragging = false; setDraggingClass(false);
        if (pointerId != null) (e.target as Element).releasePointerCapture?.(pointerId);
        pointerId = null;
      }
    };
    const end = (e: PointerEvent) => {
      if (pointerId != null) (e.target as Element).releasePointerCapture?.(pointerId);
      dragging = false; pointerId = null; setDraggingClass(false);
    };
    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
    el.classList.add('cursor-grab');
    return () => {
      el.removeEventListener('pointerdown', onPointerDown as any);
      el.removeEventListener('pointermove', onPointerMove as any);
      el.removeEventListener('pointerup', end as any);
      el.removeEventListener('pointercancel', end as any);
      el.removeEventListener('pointerleave', end as any);
      el.classList.remove('cursor-grab', 'cursor-grabbing', 'select-none');
    };
  }, []);

  useEffect(() => setIndex((i) => ((i % len) + len) % len), [len]);

  const cardInitial = prefersReduced ? { opacity: 0 } : { opacity: 0, x: 24 };
  const cardAnimate = prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0.5 };
  const cardExit    = prefersReduced ? { opacity: 0 } : { opacity: 0, x: -24 };

  const textInitial = prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 };
  const textAnimate = prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F6F7F9] py-10 md:py-14 px-4 font-[Raleway]"
      role="region"
      aria-label="Карусель возможностей"
    >
      <div className="mx-auto w-full max-w-[1120px]">
        <header className="text-center px-4">
          <h2 className="text-[#313131] font-medium leading-[1.1] text-[32px] md:text-[52px]">
            Все возможности в одном месте
          </h2>
        </header>
        <p className="mt-2 text-center text-[#7c8a9a] text-base md:text-xl leading-7 px-4">
          Управляйте городскими данными, контролем работ и отчётностью — без лишних движений.
        </p>

        {/* Трек */}
        <div
          className="relative mt-6 md:mt-8 outline-none [touch-action:pan-y]"
          ref={trackRef}
          tabIndex={0}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* Стрелки */}
          <button
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-12 z-20 h-20 w-10 items-center justify-center rounded-full bg-[#0077FF] hover:bg-[#005fcc] text-white"
            onClick={() => onPrevRef.current()}
          >
            ‹
          </button>
          <button
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-12 z-20 h-20 w-10 items-center justify-center rounded-full bg-[#0077FF] hover:bg-[#005fcc] text-white"
            onClick={() => onNextRef.current()}
          >
            ›
          </button>

          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={index}
              initial={cardInitial}
              animate={cardAnimate}
              exit={cardExit}
              transition={{
                type: prefersReduced ? 'tween' : 'spring',
                stiffness: 220,
                damping: 26,
                mass: 0.7,
                duration: prefersReduced ? 0.18 : undefined,
              }}
              className="relative w-full rounded-[22px] md:rounded-[30px] bg-white  overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 w-full h-[420px] md:h-[480px] items-stretch">
                {/* TEXT */}
                <motion.div
                  className="min-h-0 flex items-center"
                  initial={textInitial}
                  animate={textAnimate}
                  transition={{ type: prefersReduced ? 'tween' : 'spring', stiffness: 280, damping: 28, mass: 0.6, delay: prefersReduced ? 0 : 0.04 }}
                >
                  <div className="px-6 md:pl-[85px] md:pr-8 py-8 md:py-10">
                    <h3 className="text-[#313131] font-medium leading-9 text-[22px] sm:text-[26px] md:text-[31.3px]">
                      {items[index].title}
                    </h3>
                    <p className="mt-4 text-[#7c8a9a] leading-7 text-[15px] sm:text-[16px] md:text-xl">
                      {items[index].subtitle}
                    </p>
                    {renderCTA ? <div className="mt-6">{renderCTA(items[index])}</div> : null}
                  </div>
                </motion.div>

                {/* IMAGE */}
                <div className="min-h-0 p-1 md:p-2 flex">
                  <div className="w-full h-full bg-[#f6f7f9] rounded-2xl overflow-hidden flex items-end justify-center">
                    <img
                      src={items[index].image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="block max-h-[100%] max-w-[100%] object-contain pointer-events-none select-none"
                    />
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>

        {/* Гарантированный нижний отступ */}
        <div className="h-6 md:h-9" />

        {/* Индикаторы */}
        <div className="pt-1 pb-2 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`К карточке ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-[width,opacity] ${i === index ? 'w-6 bg-[#0077FF]' : 'w-2.5 bg-black/25'}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesCarousel;
