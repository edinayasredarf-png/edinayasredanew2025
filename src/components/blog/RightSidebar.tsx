'use client';

import React from 'react';
import Link from 'next/link';
import { NewsItem, sb_listNews } from '@/lib/blogStore';

export default function RightSidebar() {
  const [news, setNews] = React.useState<NewsItem[]>([]);

  // Баннеры + ссылки
  const BANNERS: { src: string; href: string; alt: string }[] = [
    {
      src: 'https://media.xn--80aaahjck7aeeme6a9b8a.xn--p1ai/media/blog/banner1.png',
      href: '/',
      alt: 'Промо — на главную 1',
    },
    {
      src: 'https://media.xn--80aaahjck7aeeme6a9b8a.xn--p1ai/media/blog/banner2.png',
      href: '/',
      alt: 'Промо — на главную 2',
    },
    {
      src: 'https://media.xn--80aaahjck7aeeme6a9b8a.xn--p1ai/media/blog/banner3.png',
      href: '/services',
      alt: 'Промо — услуги',
    },
  ];
  const ROTATE_MS = 60_000;
  const [bannerIndex, setBannerIndex] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (e) {
        console.error('Failed to load news from database:', e);
        setNews([]);
      }
    })();

    const onFocus = async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (e) {
        console.error('Failed to refresh news from database:', e);
      }
    };
    const onNewsUpdate = async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (e) {
        console.error('Failed to update news from database:', e);
      }
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('newsUpdated', onNewsUpdate as EventListener);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('newsUpdated', onNewsUpdate as EventListener);
    };
  }, []);

  React.useEffect(() => {
    if (BANNERS.length <= 1) return;
    const id = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNERS.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [BANNERS.length]);

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

        {/* Рекламный баннер с кликабельными слайдами */}
        <div className="rounded-3xl overflow-hidden border">
          <div className="relative w-full aspect-[286/424]">
            {BANNERS.map((b, idx) => (
              <Link
                key={b.src}
                href={b.href}
                className={[
                  'absolute inset-0 block transition-opacity duration-700 ease-in-out',
                  bannerIndex === idx ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
                ].join(' ')}
                aria-label={b.alt}
                prefetch={false}
              >
                <img
                  src={b.src}
                  alt={b.alt}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
