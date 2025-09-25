'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';

type Card = { title: string; subtitle: string; image: string };

const CARDS: Card[] = [
  { title: 'Контролируйте работы удалённо', subtitle: 'Подрядчики сами вносят данные — вы принимаете работы онлайн', image: '/img/card1.png' },
  { title: 'Актуальные данные 24/7', subtitle: 'Реестры всегда под рукой — для отчетов и проверок', image: '/img/card2.png' },
  { title: 'ГИС-платформа для всех данных', subtitle: 'Объекты с координатами, границами, атрибутами на карте', image: '/img/card3.png' },
  { title: 'Прозрачность действий', subtitle: 'Отслеживайте все изменения в системе', image: '/img/card4.png' },
  { title: 'Настраивайте доступы', subtitle: 'Гибко управляйте правами: администраторы, проверяющие, подрядчики', image: '/img/card5.png' },
];

const springCfg = { stiffness: 140, damping: 24, mass: 0.6 };

/* умный снэп-скролл для колеса мыши (тачпад не трогаем) */
function useSmartSnapScroll(opts: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  steps: number;        // 0..steps (обычно = items.length)
  cooldownMs?: number;
}) {
  const { containerRef, steps, cooldownMs = 800 } = opts;
  const [index, setIndex] = useState(0);
  const busyRef = useRef(false);
  const modeRef = useRef<'wheel-mouse' | 'trackpad' | null>(null);

  const snapTo = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    const totalScrollable = el.offsetHeight - window.innerHeight;
    const target = sectionTop + totalScrollable * (i / steps);
    busyRef.current = true;
    window.scrollTo({ top: target, behavior: 'smooth' });
    window.setTimeout(() => (busyRef.current = false), cooldownMs);
  };

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const inView = rect.top <= window.innerHeight && rect.bottom >= 0;
      if (!inView) return;

      if (busyRef.current) {
        e.preventDefault();
        return;
      }

      const isMouseWheel = e.deltaMode === 1 || Math.abs(e.deltaY) > 60;
      if (modeRef.current == null) {
        modeRef.current = isMouseWheel ? 'wheel-mouse' : 'trackpad';
      } else if (isMouseWheel) {
        modeRef.current = 'wheel-mouse';
      }

      if (modeRef.current === 'wheel-mouse') {
        const dir = e.deltaY > 0 ? 1 : -1;

        // если дальше листать нельзя — не перехватываем, чтобы уйти к следующей секции
        if (dir > 0 && index >= steps) return;
        if (dir < 0 && index <= 0) return;

        e.preventDefault();
        const next = Math.min(steps, Math.max(0, index + dir));
        if (next !== index) {
          setIndex(next);
          snapTo(next);
        }
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel as any);
  }, [index, steps, containerRef, cooldownMs]);

  // клавиатура — тоже даём выйти за границы секции
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const nextKeys = ['ArrowDown', 'ArrowRight', 'PageDown', ' '];
      const prevKeys = ['ArrowUp', 'ArrowLeft', 'PageUp'];

      if (nextKeys.includes(e.key)) {
        if (index >= steps) return;
        e.preventDefault();
        const next = Math.min(steps, index + 1);
        setIndex(next);
        snapTo(next);
      } else if (prevKeys.includes(e.key)) {
        if (index <= 0) return;
        e.preventDefault();
        const prev = Math.max(0, index - 1);
        setIndex(prev);
        snapTo(prev);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setIndex(0);
        snapTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setIndex(steps);
        snapTo(steps);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, steps]);
}

/* главный компонент */
const SplitStacksClean: React.FC<{ items?: Card[] }> = ({ items = CARDS }) => {
  const total = items.length;
  const pinRef = useRef<HTMLDivElement | null>(null);

  const [vh, setVh] = useState<number>(typeof window === 'undefined' ? 800 : window.innerHeight);
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const BOTTOM_BASE = Math.round(vh * 0.52);
  const BOTTOM_GAP  = Math.round(vh * 0.30);
  const TOP_GAP     = 18;
  const CANVAS_H    = Math.max(vh * 0.66, 560);

  const sectionHeightVh = useMemo(() => (total + 1) * 100, [total]);

  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ['start start', 'end end'],
  });

  const tRaw = useTransform(scrollYProgress, (v) => v * total);
  const t = useSpring(tRaw, springCfg);

  // включаем умный снэп для колеса
  useSmartSnapScroll({ containerRef: pinRef, steps: total, cooldownMs: 800 });

  return (
    <section className="relative w-full bg-[#F6F7F9] py-6 md:py-10">
      <div ref={pinRef} className="relative w-full" style={{ height: `calc(${sectionHeightVh}vh)` }}>
        <div className="sticky top-0 h-[20svh]">
          {/* Заголовок */}
          <div className="flex flex-col items-center text-center pt-4 md:pt-6">
            <h2 className="text-black font-bold leading-[1.1] text-[34px] md:text-[46px] lg:text-[52px]">
              Все возможности в одном месте
            </h2>
            <p className="mt-2 text-black/60 text-base md:text-xl">
              Управляйте городскими данными, контролем работ и отчетностью — онлайн и без лишних движений.
            </p>
          </div>

          {/* Стек карточек */}
          <div className="mt-4 md:mt-6 flex items-start justify-center">
            <div className="relative w-[92vw] max-w-[980px]" style={{ height: CANVAS_H }}>
              {items.map((card, i) => {
                const yBase: MotionValue<number> = useTransform(t, (v) => {
                  const k = Math.floor(v);
                  const f = v - k;
                  if (i < k) return -(k - 1 - i) * TOP_GAP;     // верхняя компактная стопка
                  if (i === k) return 0;                         // активная
                  if (i === k + 1) return (1 - f) * BOTTOM_BASE; // подъём из нижней
                  return BOTTOM_BASE + (i - (k + 1)) * BOTTOM_GAP; // нижняя ступенчатая
                });
                const y = useSpring(yBase, springCfg);

                const z = useTransform(t, (v) => {
                  const k = Math.floor(v);
                  if (i === k + 1) return 3;
                  if (i === k) return 2;
                  if (i < k) return 1;
                  return 0;
                });

                return (
                  <motion.article
                    key={i}
                    className="absolute left-1/2 -translate-x-1/2 will-change-transform"
                    style={{ bottom: 0, y, zIndex: (z as unknown as number), width: '100%' }}
                  >
                    <div className="relative w-full rounded-3xl bg-white border border-[#E7ECF4] overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-2 md:[aspect-ratio:2/1]" style={{ minHeight: 300 }}>
                        {/* Текст */}
                        <div className="flex items-center">
                          <div className="px-6 pt-6 pb-4 md:px-10 md:py-10">
                            <h3 className="text-black font-semibold leading-[1.15] text-[22px] sm:text-[26px] md:text-[32px] lg:text-[36px]">
                              {card.title}
                            </h3>
                            <p className="mt-4 text-black/70 leading-snug text-[15px] sm:text-[16px] md:text-[18px]">
                              {card.subtitle}
                            </p>
                          </div>
                        </div>
                        {/* Изображение */}
                        <div className="flex items-end justify-center px-2 pt-2 pb-0 md:px-2 md:pt-2 md:pb-0">
                          <img
                            src={card.image}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-contain object-bottom"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <div className="h-8 md:h-10" />
        </div>
      </div>
    </section>
  );
};

export default SplitStacksClean;
