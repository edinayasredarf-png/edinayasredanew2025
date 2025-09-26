'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';

type Card = { title: string; subtitle: string; image: string };

const CARDS: Card[] = [
  { title: 'Контролируйте работы удалённо', subtitle: 'Подрядчики сами вносят данные — вы принимаете работы онлайн', image: '/img/card1.webp' },
  { title: 'Актуальные данные 24/7', subtitle: 'Реестры всегда под рукой — для отчетов и проверок', image: '/img/card2.webp' },
  { title: 'ГИС-платформа для всех данных', subtitle: 'Объекты с координатами, границами, атрибутами на карте', image: '/img/card3.webp' },
  { title: 'Прозрачность действий', subtitle: 'Отслеживайте все изменения в системе', image: '/img/card4.webp' },
  { title: 'Настраивайте доступы', subtitle: 'Гибко управляйте правами: администраторы, проверяющие, подрядчики', image: '/img/card5.webp' },
];

// пружина для анимаций
const springCfg = { stiffness: 140, damping: 24, mass: 0.6 };

const SplitStacksClean: React.FC<{ items?: Card[] }> = ({ items = CARDS }) => {
  const total = items.length;
  const pinRef = useRef<HTMLDivElement | null>(null);

  // адаптивность от высоты окна
  const [vh, setVh] = useState<number>(typeof window === 'undefined' ? 800 : window.innerHeight);
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // параметры стопок
  const BOTTOM_BASE = Math.round(vh * 0.52); // старт нижней ближайшей карточки (крупный зазор)
  const BOTTOM_GAP  = Math.round(vh * 0.30); // шаг нижней стопки (явные ступени)
  const TOP_GAP     = 18;                    // шаг верхней компактной стопки
  const CANVAS_H    = Math.max(vh * 0.66, 560); // высота области движения

  // высота секции — держим скролл
  const sectionHeightVh = useMemo(() => (total + 1) * 100, [total]);

  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ['start start', 'end end'],
  });

  // плавный глобальный прогресс t ∈ [0..N]
  const tRaw = useTransform(scrollYProgress, (v) => v * total);
  const t = useSpring(tRaw, springCfg);

  return (
    <section className="relative w-full bg-[#F6F7F9] py-6 md:py-10">
      <div ref={pinRef} className="relative w-full" style={{ height: `calc(${sectionHeightVh}vh)` }}>
        <div className="sticky top-0 h-[100svh]">
          {/* Заголовок (уменьшил верхний внутренний отступ) */}
          <div className="flex flex-col items-center text-center pt-4 md:pt-6">
            <h2 className="text-black font-bold leading-[1.1] text-[34px] md:text-[46px] lg:text-[52px]">
              Все возможности в одном месте
            </h2>
            <p className="mt-2 text-black/60 text-base md:text-xl">
              Управляйте городскими данными, контролем работ и отчетностью — онлайн и без лишних движений.
            </p>
          </div>

          {/* Область стека (уменьшил зазор сверху) */}
          <div className="mt-4 md:mt-6 flex items-start justify-center">
            <div className="relative w-[92vw] max-w-[980px]" style={{ height: CANVAS_H }}>
              {items.map((card, i) => {
                // плавный y через пружину
                const yBase: MotionValue<number> = useTransform(t, (v) => {
                  const k = Math.floor(v);
                  const f = v - k; // 0..1
                  if (i < k) return - (k - 1 - i) * TOP_GAP;                  // верхняя компактная стопка
                  if (i === k) return 0;                                       // активная верхняя
                  if (i === k + 1) return (1 - f) * BOTTOM_BASE;               // подъём из нижней
                  return BOTTOM_BASE + (i - (k + 1)) * BOTTOM_GAP;             // нижняя ступенчатая стопка
                });
                const y = useSpring(yBase, springCfg);

                // порядок наложения
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
                    style={{
                      bottom: 0,
                      y,
                      zIndex: z as unknown as number,
                      width: '100%',
                    }}
                  >
                    {/* Белая карточка: без тени, ровная граница */}
                    <div className="relative w-full rounded-3xl bg-white border border-[#E7ECF4] overflow-hidden">
                      {/* Ровное деление: на мобиле — одна колонка (картинка под текстом), на md+ — 2 колонки */}
                      <div
                        className="
                          grid grid-cols-1 md:grid-cols-2
                          md:[aspect-ratio:2/1]
                        "
                        style={{ minHeight: 300 }}
                      >
                        {/* Текст — равные внутренние отступы */}
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

                        {/* Изображение — БЕЗ нижних отступов, прижато к низу */}
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

          {/* нижний отступ секции уменьшен */}
          <div className="h-8 md:h-10" />
        </div>
      </div>
    </section>
  );
};

export default SplitStacksClean;
