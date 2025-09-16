'use client';

import React from 'react';
import Link from 'next/link';
import { NewsItem, sb_listNews } from '@/lib/blogStore';

// Фиксированный набор баннеров в заданном порядке.
// Первые два — на главную, третий — на /services.
// v=3 для пробития кэша на проде.
type Ad = { src: string; href: string; alt: string };
const ADS: readonly Ad[] = Object.freeze([
  { src: '/img/ads/banner1.png?v=3', href: '/',         alt: 'Баннер 1 — главная' },
  { src: '/img/ads/banner2.png?v=3', href: '/',         alt: 'Баннер 2 — главная' },
  { src: '/img/ads/banner3.png?v=3', href: '/services', alt: 'Баннер 3 — услуги' },
]);

export default function RightSidebar() {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [adIndex, setAdIndex] = React.useState(0);
  const [fadeIn, setFadeIn] = React.useState(true);
  const intervalRef = React.useRef<number | null>(null);

  // Загрузка новостей из БД + обновления по событию/фокусу
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
    window.addEventListener('newsUpdated', onNewsUpdate as EventListener);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('newsUpdated', onNewsUpdate as EventListener);
    };
  }, []);

  // Ротация баннеров — стабильно 0→1→2→…
  React.useEffect(() => {
    // каждые 60 сек, с лёгким кроссфейдом
    intervalRef.current = window.setInterval(() => {
      setFadeIn(false);
      window.setTimeout(() => {
        setAdIndex((prev) => (prev + 1) % ADS.length);
        setFadeIn(true);
      }, 160); // короткая фаза исчезновения
    }, 60_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const currentAd = ADS[adIndex];

  return (
    <aside className="w-[287px] shrink-0 hidden xl:block">
      <div className="sticky top-[86px] space-y-4">
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

        {/* Рекламный блок — один баннер, который сменяется раз в минуту */}
        <div className="rounded-3xl overflow-hidden border">
          <Link href={currentAd.href} prefetch={false} aria-label={currentAd.alt}>
            <img
              src={currentAd.src}
              alt={currentAd.alt}
              className={`w-full h-auto transition-opacity duration-300 ${
                fadeIn ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </Link>
        </div>
      </div>
    </aside>
  );
}
