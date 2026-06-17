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
  ctaHref?: string;
}

const DEFAULT_ITEMS: [BadgeItem, BadgeItem, BadgeItem] = [
  { title: 'В Едином реестре российского ПО', iconSrc: '/icons/gerb.svg', iconAlt: 'Герб РФ' },
  { title: 'Аккредитованная IT-компания', iconSrc: '/icons/it-company.svg', iconAlt: 'Знак IT-компании' },
  { title: 'Резидент Сколково', iconSrc: '/icons/skolkovo.svg', iconAlt: 'Логотип Сколково' },
];

const Card: React.FC<BadgeItem> = ({ title, iconSrc, iconAlt }) => (
  <div className="w-full bg-white rounded-2xl p-2">
    <div className="rd-block w-full h-[250px] rounded-2xl relative overflow-hidden">
      <div className="absolute left-1/2 -translate-x-1/2 top-[18px] w-[110px] h-[110px] rounded-[18px] outline outline-1 outline-offset-[-1px] outline-[#e6ecf4] overflow-hidden flex items-center justify-center bg-white">
        <Image
          src={iconSrc}
          alt={iconAlt ?? ''}
          width={80}
          height={80}
          className="w-[80px] h-[80px] object-contain"
          loading="lazy"
        />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[18px] p-4 w-[90%] max-w-[400px]">
        <h4 className="text-center text-[#7c8a9a] text-[20px] sm:text-[22px] md:text-[26px] font-medium font-[Raleway] leading-8 line-clamp-2">
          {title}
        </h4>
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
    <section className="bg-[#F6F7F9] w-full py-10 md:py-14 lg:py-16 font-[Raleway]" aria-label="Факты о компании">
      <div className="rd-content-column">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-2.5 items-stretch">
          <Card {...items[0]} />
          <Card {...items[1]} />
          <Card {...items[2]} />
        </div>

        <div className="mt-10 md:mt-12 flex justify-center">
          <Link
            href={ctaHref}
            prefetch
            className="inline-flex px-5 py-3.5 bg-[#029cda] text-white rounded-lg text-base md:text-xl font-medium leading-7 hover:bg-[#0288bd] transition-colors focus:outline-none focus:ring-2 focus:ring-[#029cda]/40"
            aria-label={`${ctaLabel} — перейти на страницу`}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CompanyBadges;
