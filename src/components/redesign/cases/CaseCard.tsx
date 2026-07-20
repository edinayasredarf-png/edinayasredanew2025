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

function formatCaseCardDate(ts: number): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getFullYear()}`;
}

export function CaseCard({ item, size = 'default' }: { item: CaseCardItem; size?: 'default' | 'featured' }) {
  const isFeatured = size === 'featured' || item.featured;
  const serviceType = item.application?.trim();
  const dateLabel = item.date ? formatCaseCardDate(item.date) : null;

  return (
    <Link
      href={item.href}
      className={`group block font-[Inter] ${isFeatured ? 'md:col-span-2' : ''}`}
    >
      <article className="relative flex flex-col w-full">
        <div className="relative w-full aspect-[341/471] rounded-2xl overflow-hidden bg-neutral-100">
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
          {dateLabel && (
            <div className="absolute left-4 bottom-4 z-10 rounded-xl bg-black/30 px-2 py-1">
              <time
                dateTime={new Date(item.date!).toISOString()}
                className="text-[15px] font-medium leading-[18px] text-white lining-nums"
              >
                {dateLabel}
              </time>
            </div>
          )}
        </div>

        <h3 className="mt-3 px-1 text-base font-medium leading-6 tracking-tight text-[#202020] line-clamp-3 group-hover:text-[#029cda] transition-colors">
          {item.title}
        </h3>

        {serviceType && (
          <p className="mt-1.5 px-1 text-[15px] font-medium leading-5 tracking-tight text-[#6D7885] line-clamp-1">
            {serviceType}
          </p>
        )}
      </article>
    </Link>
  );
}
