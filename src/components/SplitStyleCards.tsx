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
const WHEEL_COOLDOWN_MS   = 240;
const WHEEL_MIN_DELTA_PX  = 28;
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
    const preload = (src?: string) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
      // @ts-ignore
      img.decode?.().catch(() => {});
    };
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
  const [progress, setProgress] = useState(0);

  const go = useCallback((next: number) => {
    const normalized = ((next % len) + len) % len;
    setIndex(normalized);
    onChange?.(normalized);
  }, [len, onChange]);

  const next = useCallback(() => {
    go(index + 1);
    lastInteractTs.current = Date.now();
  }, [go, index]);

  const prev = useCallback(() => {
    go(index - 1);
    lastInteractTs.current = Date.now();
  }, [go, index]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const target = `#f${index + 1}`;
    if (window.location.hash !== target) {
      window.history?.replaceState?.(null, '', target);
    }
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
    const el = trackRef.current;
    if (!el) return;
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
    const el = trackRef.current;
    if (!el) return;
    let startX = 0, startY = 0, dragging = false, pointerId: number | null = null;
    const setDraggingClass = (on: boolean) => {
      el.classList.toggle('cursor-grabbing', on);
      el.classList.toggle('select-none', on);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerId = e.pointerId;
      (e.target as Element).setPointerCapture?.(pointerId);
      startX = e.clientX; startY = e.clientY; dragging = true; setDraggingClass(true);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_MOUSE_THRESHOLD) {
        dx < 0 ? onNextRef.current() : onPrevRef.current();
        lastInteractTs.current = Date.now();
        dragging = false; setDraggingClass(false);
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

  useEffect(() => {
    if (!autoplay || prefersReduced) return;
    let timer: number | null = null;
    let startedAt = 0;
    let raf = 0;

    const baseInterval = Math.max(1500, intervalMs);

    const start = () => {
      if (hovering || document.hidden || !inView) return;
      startedAt = Date.now();
      timer = window.setInterval(() => {
        if (Date.now() - lastInteractTs.current < 400) return;
        onNextRef.current();
        startedAt = Date.now();
        setProgress(0);
      }, baseInterval);
    };
    const stop = () => { if (timer) { window.clearInterval(timer); timer = null; } };

    const tick = () => {
      if (timer && !hovering && !document.hidden && inView) {
        const t = Math.min(1, (Date.now() - startedAt) / baseInterval);
        setProgress(t);
      }
      raf = requestAnimationFrame(tick);
    };

    start();
    raf = requestAnimationFrame(tick);

    const onVis = () => { stop(); setProgress(0); start(); };
    window.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    window.addEventListener('blur', stop);

    return () => {
      stop();
      cancelAnimationFrame(raf);
      window.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
      window.removeEventListener('blur', stop);
    };
  }, [autoplay, prefersReduced, intervalMs, hovering, inView]);

  useEffect(() => setIndex((i) => ((i % len) + len) % len), [len]);

  const cardInitial = prefersReduced ? { opacity: 0 } : { opacity: 0, x: 24 };
  const cardAnimate = prefersReduced ? { opacity: 1 } : { opacity: 1, x: 0.5 };
  const cardExit    = prefersReduced ? { opacity: 0 } : { opacity: 0, x: -24 };

  const textInitial = prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 };
  const textAnimate = prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 };
  const imgInitial  = prefersReduced ? { opacity: 0 } : { opacity: 0, y: 18 };
  const imgAnimate  = prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F6F7F9] py-10 md:py-14"
      role="region"
      aria-label="Карусель возможностей"
    >
      <div className="mx-auto w-[92vw] max-w-[1120px]">
        <header className="text-center px-4">
          <h2 className="text-black font-bold leading-[1.1] text-[30px] md:text-[44px]">
            Все возможности в одном месте
          </h2>
          <p className="mt-2 text-black/60 text-base md:text-xl">
            Управляйте городскими данными, контролем работ и отчётностью — без лишних движений.
          </p>
        </header>

        {/* карточка + стрелки */}
        <div
          className="relative mt-6 md:mt-8 outline-none [touch-action:pan-y] rounded-xl"
          ref={trackRef}
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label="Свайпайте или используйте колёсико и стрелки"
          aria-live="off"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {/* Стрелки вынесены ЗА границы карточки */}
          <button
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-12 z-20 h-20 w-10 items-center justify-center rounded-full bg-[#0077FF] border border-[#E7ECF4]  hover:bg-[#005fcc] focus-visible:ring-2 focus-visible:ring-black/40"
            aria-label="Предыдущий слайд"
            onClick={() => onPrevRef.current()}
          >
            ‹
          </button>
          <button
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -right-12 z-20 h-20 w-10 items-center justify-center rounded-full bg-[#0077FF] border border-[#E7ECF4]  hover:bg-[#005fcc] focus-visible:ring-2 focus-visible:ring-black/40"
            aria-label="Следующий слайд"
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
              className="relative w-full rounded-3xl bg-white border border-[#E7ECF4] overflow-hidden will-change-transform"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 md:[aspect-ratio:2/1]" style={{ minHeight: 320 }}>
                {/* TEXT */}
                <motion.div
                  className="flex items-center"
                  initial={textInitial}
                  animate={textAnimate}
                  transition={{ type: prefersReduced ? 'tween' : 'spring', stiffness: 280, damping: 28, mass: 0.6, delay: prefersReduced ? 0 : 0.04 }}
                >
                  <div className="px-6 py-8 md:px-10 md:py-10">
                    <h3 className="text-black font-semibold leading-[1.15] text-[22px] sm:text-[26px] md:text-[32px]">
                      {items[index].title}
                    </h3>
                    <p className="mt-4 text-black/70 leading-snug text-[15px] sm:text-[16px] md:text-[18px]">
                      {items[index].subtitle}
                    </p>

                    {renderCTA ? (
                      <div className="mt-6">{renderCTA(items[index])}</div>
                    ) : null}
                  </div>
                </motion.div>

                {/* IMAGE */}
                <motion.div
                  className="flex items-end justify-center px-2 pt-2 pb-0 md:px-2 md:pt-2 md:pb-0"
                  initial={imgInitial}
                  animate={imgAnimate}
                  transition={{ type: prefersReduced ? 'tween' : 'spring', stiffness: 40, damping: 10, mass: 0.7, delay: prefersReduced ? 0 : 0.06 }}
                >
                  <div className="w-full h-full md:aspect-[4/3] flex items-end">
                    <img
                      src={items[index].image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      draggable={false}
                      className="w-full h-full object-contain object-bottom pointer-events-none select-none will-change-transform"
                    />
                  </div>
                </motion.div>
              </div>


            </motion.article>
          </AnimatePresence>

          {/* live-объявление для скринридеров */}
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            Слайд {index + 1} из {len}: {items[index].title}
          </span>
        </div>

        {/* индикаторы-точки */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`К карточке ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              className={`h-2.5 rounded-full transition-[width,opacity] focus-visible:ring-2 focus-visible:ring-[black/40] ${
                i === index ? 'w-6 bg-[#0077FF]' : 'w-2.5 bg-black/25'
              }`}
              onClick={() => { setIndex(i); lastInteractTs.current = Date.now(); setProgress(0); }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesCarousel;
