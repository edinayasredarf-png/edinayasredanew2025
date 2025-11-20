'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

type BadgeItem = {
  title: string;
  iconSrc: string;
  iconAlt?: string;
};

interface CompanyBadgesProps {
  items?: [BadgeItem, BadgeItem, BadgeItem];
  ctaLabel?: string;
  ctaHref?: string; // по умолчанию ведёт на /about
}

const DEFAULT_ITEMS: [BadgeItem, BadgeItem, BadgeItem] = [
  { title: 'В Едином реестре российского ПО', iconSrc: '/icons/gerb.svg', iconAlt: 'Герб РФ' },
  { title: 'Аккредитованная IT-компания', iconSrc: '/icons/it-company.svg', iconAlt: 'Знак IT-компании' },
  { title: 'Резидент Сколково', iconSrc: '/icons/skolkovo.svg', iconAlt: 'Логотип Сколково' },
];

const Card: React.FC<BadgeItem> = ({ title, iconSrc, iconAlt }) => (
  <div className="w-full bg-white rounded-3xl inline-flex flex-col justify-center items-start">
    <div className="w-full p-2">
      {/* Уменьшена высота блока */}
      <div className="w-full h-[250px] bg-[#f6f7f9] rounded-2xl relative overflow-hidden">
        {/* Иконка */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-[110px] h-[110px] rounded-[18px] outline outline-1 outline-offset-[-1px] outline-[#e6ecf4] overflow-hidden flex items-center justify-center bg-white/0">
          <Image
            src={iconSrc}
            alt={iconAlt ?? ''}
            width={80}
            height={80}
            className="w-[80px] h-[80px] object-contain"
            loading="lazy"
          />
        </div>

        {/* Заголовок с ограничением в 2 строки */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[18px] p-4 w-[90%] max-w-[400px]">
          <h4 className="text-center text-[#7C8A9A] text-[20px] sm:text-[22px] md:text-[26px] font-medium font-[Raleway] leading-8 line-clamp-2 overflow-hidden text-ellipsis break-words">
            {title}
          </h4>
        </div>
      </div>
    </div>
  </div>
);

const CompanyBadges: React.FC<CompanyBadgesProps> = ({
  items = DEFAULT_ITEMS,
  ctaLabel = 'Подробнее о компании',
  ctaHref = '/about',
}) => {
  return (
    <section
      className="w-full flex flex-col items-center justify-center gap-4 py-6 md:py-10 font-[Raleway] mt-20"
      aria-label="Факты о компании"
    >
      <div className="w-full max-w-[1480px] px-2">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-2 items-stretch justify-center">
          <Card {...items[0]} />
          <Card {...items[1]} />
          <Card {...items[2]} />
        </div>
      </div>

      {/* Отступ сверху у кнопки */}
      <div className="mt-10">
        <Link
          href={ctaHref}
          prefetch
          className="inline-flex px-5 py-3.5 bg-[#0077ff] text-white rounded-xl text-base md:text-xl font-medium leading-7 hover:bg-[#0a6ae0] active:bg-[#085bbf] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0077ff]/40"
          aria-label={`${ctaLabel} — перейти на страницу`}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
};

export default CompanyBadges;
