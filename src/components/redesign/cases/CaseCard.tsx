'use client';

import Image from 'next/image';
import Link from 'next/link';

export type CaseCardItem = {
  id: string | number;
  href: string;
  title: string;
  description?: string;
  image: string;
  application?: string;
  location?: string;
  date?: number;
  featured?: boolean;
};

export function CaseCard({ item, size = 'default' }: { item: CaseCardItem; size?: 'default' | 'featured' }) {
  const isFeatured = size === 'featured' || item.featured;
  const serviceType = item.application?.trim();
  const city = item.location?.trim();

  return (
    <Link
      href={item.href}
      className={`group flex flex-col h-full bg-[#F6F7F9] rounded-[32px] pt-5 pb-8 transition-shadow hover:shadow-[0_10px_34px_rgba(15,23,42,0.08)] ${
        isFeatured ? 'md:col-span-2' : ''
      }`}
    >
      {/* Изображение */}
      <div className="mx-5 relative aspect-[16/10] rounded-[20px] overflow-hidden bg-[#ebebeb]">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          sizes={
            isFeatured
              ? '(max-width: 768px) 100vw, 66vw'
              : '(max-width: 768px) 100vw, 33vw'
          }
        />

        {/* Город проведения кейса */}
        {city && (
          <div className="absolute left-4 bottom-4 z-10 inline-flex items-center gap-1.5 rounded-xl bg-white/90 backdrop-blur px-3 py-1.5 shadow-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#029cda"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="text-[14px] font-medium leading-none text-[#050c26]">
              {city}
            </span>
          </div>
        )}
      </div>

      {/* Заголовок */}
      <h3 className="mt-6 mx-8 font-involve text-[#050c26] text-xl font-medium leading-7 tracking-wide line-clamp-3">
        {item.title}
      </h3>

      {/* Тип услуги */}
      {serviceType && (
        <p className="mt-2 mx-8 text-[15px] font-medium leading-5 tracking-tight text-[#6D7885] line-clamp-1">
          {serviceType}
        </p>
      )}

      {/* Подробнее */}
      <span className="mt-auto pt-6 mx-8 text-[#029cda] text-lg font-medium font-involve leading-7 group-hover:underline">
        Подробнее
      </span>
    </Link>
  );
}
