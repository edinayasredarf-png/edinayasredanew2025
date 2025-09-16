'use client';

import React from 'react';
import Link from 'next/link';
import { NewsItem, sb_listNews } from '@/lib/blogStore';

// Слайды рекламного блока (файлы лежат в /public/img/ads)
const ADS: { src: string; href: string; alt: string }[] = [
  { src: '/img/ads/banner1.png', href: '/',          alt: 'Баннер 1 — переход на главную' },
  { src: '/img/ads/banner2.png', href: '/',          alt: 'Баннер 2 — переход на главную' },
  { src: '/img/ads/banner3.png', href: '/services',  alt: 'Баннер 3 — переход к услугам' },
];

export default function RightSidebar() {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [adIndex, setAdIndex] = React.useState(0);

  // Грузим новости из БД
  React.useEffect(() => {
    const load = async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (e) {
        console.error('Failed to load news from database:', e);
        setNews([]);
      }
    };
    load();

    const onFocus = () => load();
    const onNewsUpdate = () => load();

    window.addEventListener('focus', onFocus);
    window.addEventListener('newsUpdated' as any, onNewsUpdate);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('newsUpdated' as any, onNewsUpdate);
    };
  }, []);

  // Прелоад изображений баннеров
  React.useEffect(() => {
    ADS.forEach(a => {
      const img = new Image();
      img.src = a.src;
    });
  }, []);

  // Смена слайда раз в минуту
  React.useEffect(() => {
    const id = setInterval(() => {
      setAdIndex((i) => (i + 1) % ADS.length);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside className="w-[287px] shrink-0 hidden xl:block">
      <div className="sticky top-[86px] space-y-4">
        {/* Новости */}
        <div className="p-5 bg-white rounded-3xl border space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#111]">Новости</h3>
            <Link
              href="/news"
              className="h-8 px-3 rounded-lg bg-[#111] text-white hover:bg-[#333] text-sm flex items-center"
            >
              Все
            </Link>
          </div>
          <div className="space-y-4">
            {news.slice(0, 6).map((n) => (
              <div key={n.id} className="space-y-1">
                <div className="text-sm text-[#52555a]">
                  {new Date(n.createdAt).toLocaleDateString('ru-RU')}
                </div>
                <Link
                  href={`/news/${n.slug}`}
                  className="text-base text-[#111] leading-snug hover:underline"
                >
                  {n.title}
                </Link>
              </div>
            ))}
            {!news.length && (
              <div className="text-sm text-[#52555a]">Еще нет новостей</div>
            )}
          </div>
        </div>

        {/* Рекламный блок с кросс-фейдом */}
        <div className="relative rounded-3xl overflow-hidden border h-[424px]">
          {ADS.map((ad, i) => (
            <Link
              key={i}
              href={ad.href}
              aria-label={ad.alt}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === adIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={ad.src}
                alt={ad.alt}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
