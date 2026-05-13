'use client';

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

/* -------- данные -------- */
type Logo = { src: string; alt: string; href: string };

const colA: Logo[] = [
  { src: '/img/logos/fasie1.svg',     alt: 'Фонд содействия инновациям',            href: 'https://www.fasie.ru/' },
  { src: '/img/logos/frii_logo.svg', alt: 'Фонд развития интернет-инициатив',     href: 'https://www.iidf.ru/' },
  { src: '/img/logos/mincifry.svg',  alt: 'МинЦифры',                               href: 'https://digital.gov.ru/' },
	{ src: '/img/logos/fasie1.svg',     alt: 'Фонд содействия инновациям',            href: 'https://www.fasie.ru/' },
  { src: '/img/logos/frii_logo.svg', alt: 'Фонд развития интернет-инициатив',     href: 'https://www.iidf.ru/' },
  { src: '/img/logos/mincifry.svg',  alt: 'МинЦифры',                               href: 'https://digital.gov.ru/' },
];

const colB: Logo[] = [
  { src: '/img/logos/minstroy.svg',  alt: 'МинСтрой',                               href: 'https://www.minstroyrf.ru/' },
  { src: '/img/logos/myroots.svg',   alt: 'Мои Корни',                              href: 'https://myroots.pro/' },
  { src: '/img/logos/skolkovo.svg',  alt: 'Сколково',                               href: 'https://sk.ru/' },
  { src: '/img/logos/asi.svg',       alt: 'Агентство стратегических инициатив',     href: 'https://asi.ru/' },
	{ src: '/img/logos/minstroy.svg',  alt: 'МинСтрой',                               href: 'https://www.minstroyrf.ru/' },
  { src: '/img/logos/myroots.svg',   alt: 'Мои Корни',                              href: 'https://myroots.pro/' },
  { src: '/img/logos/skolkovo.svg',  alt: 'Сколково',                               href: 'https://sk.ru/' },
  { src: '/img/logos/asi.svg',       alt: 'Агентство стратегических инициатив',     href: 'https://asi.ru/' },
];

/* -------- атомы UI -------- */

const LogoCard: React.FC<Logo> = ({ src, alt, href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={alt}
    className="
      block w-full rounded-2xl border border-[#EEF1F5]
      bg-white hover:bg-[#F1F3F6] transition-colors
      h-24 md:h-28 p-4
      flex items-center justify-center
    "
  >
    <Image
      src={src}
      alt={alt}
      width={120}
      height={48}
      className="max-h-10 md:max-h-12 w-auto object-contain"
      loading="lazy"
    />
  </a>
);

/* -------- вертикальная бесшовная колонка (для md+) -------- */
const ColumnMarqueeV: React.FC<{
  items: Logo[];
  speed?: number;
  gap?: number;
  heightClass?: string;
  direction?: 'down' | 'up';
}> = ({ items, speed = 22, gap = 14, heightClass = 'h-[520px] md:h-[600px]', direction = 'down' }) => {
  const reduce = useReducedMotion();
  const doubled = [...items, ...items];
  const from = direction === 'down' ? '-50%' : '0%';
  const to   = direction === 'down' ? '0%'   : '-50%';

  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0px, #000 24px, #000 calc(100% - 24px), rgba(0,0,0,0) 100%)',
    maskImage:       'linear-gradient(to bottom, rgba(0,0,0,0) 0px, #000 24px, #000 calc(100% - 24px), rgba(0,0,0,0) 100%)',
  };

  return (
    <div className={`relative overflow-hidden ${heightClass}`} style={maskStyle}>
      <motion.div
        className="absolute left-0 top-0 w-full"
        style={{ gap }}
        animate={reduce ? undefined : { y: [from, to] }}
        transition={reduce ? undefined : { duration: speed, ease: 'linear', repeat: Infinity }}
      >
        <div className="flex flex-col" style={{ gap }}>
          {doubled.map((logo, i) => (
            <LogoCard key={`${logo.alt}-v-${i}`} {...logo} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* -------- горизонтальная бесшовная дорожка (для mobile < md) -------- */
const RowMarqueeH: React.FC<{
  items: Logo[];
  speed?: number;
  gap?: number;
  heightClass?: string;   // высота ряда
  direction?: 'right' | 'left';
}> = ({ items, speed = 18, gap = 12, heightClass = 'h-[120px]', direction = 'right' }) => {
  const reduce = useReducedMotion();
  const doubled = [...items, ...items];
  const from = direction === 'right' ? '-50%' : '0%';
  const to   = direction === 'right' ? '0%'   : '-50%';

  // Маска слева/справа — никаких «просветов», не зависит от цвета фона
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0) 0px, #000 24px, #000 calc(100% - 24px), rgba(0,0,0,0) 100%)',
    maskImage:       'linear-gradient(to right, rgba(0,0,0,0) 0px, #000 24px, #000 calc(100% - 24px), rgba(0,0,0,0) 100%)',
  };

  return (
    <div className={`relative overflow-hidden ${heightClass}`} style={maskStyle}>
      <motion.div
        className="absolute top-0 left-0 h-full"
        style={{ gap, display: 'flex' }}
        animate={reduce ? undefined : { x: [from, to] }}
        transition={reduce ? undefined : { duration: speed, ease: 'linear', repeat: Infinity }}
      >
        <div className="flex items-stretch" style={{ gap }}>
          {doubled.map((logo, i) => (
            <div key={`${logo.alt}-h-${i}`} className="w-[68vw] xs:w-[56vw] sm:w-[48vw] max-w-[360px]">
              <LogoCard {...logo} />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

/* -------- главный компонент -------- */
const PartnersWallTwoCols: React.FC = () => {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="mx-auto w-full max-w-page px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Заголовок/текст слева */}
          <div className="lg:col-span-5">
            <h2 className="text-3xl md:text-5xl font-semibold leading-tight text-black">
              Разработано при поддержке
            </h2>
            <p className="mt-4 md:mt-6 text-base md:text-xl text-gray-600 max-w-[560px]">
              Нам доверяют крупные организации. Совместно проводим пилоты и внедряем решения
              на государственном уровне.
            </p>
          </div>

          {/* Лэйаут логотипов */}
          <div className="lg:col-span-7 w-full">
            {/* Mobile (<md): две ГОРИЗОНТАЛЬНЫЕ дорожки */}
            <div className="md:hidden space-y-3">
              <RowMarqueeH items={colA} speed={18} direction="right"  heightClass="h-[116px]" />
              <RowMarqueeH items={colB} speed={20} direction="left"   heightClass="h-[116px]" />
            </div>

            {/* Desktop (md+): две ВЕРТИКАЛЬНЫЕ колонки */}
            <div className="hidden md:grid grid-cols-2 gap-4 md:gap-5">
              <ColumnMarqueeV items={colA} speed={22} direction="down" />
              <ColumnMarqueeV items={colB} speed={26} direction="up" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersWallTwoCols;
