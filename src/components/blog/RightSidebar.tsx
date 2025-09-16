// src/components/blog/RightSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { sb_listNews, NewsItem } from '@/lib/blogStore';

/** ---------- Мини-карусель без стрелок ---------- */
type Banner = { src: string; href: string; alt?: string };

function AdsCarousel() {
  // фиксированный порядок и ссылки (1–2 -> главная, 3 -> услуги)
  const banners = React.useMemo<Banner[]>(
    () => [
      { src: '/img/ads/banner1.png', href: '/', alt: 'Реклама 1' },
      { src: '/img/ads/banner2.png', href: '/', alt: 'Реклама 2' },
      { src: '/img/ads/banner3.png', href: '/services', alt: 'Реклама 3' },
    ],
    []
  );

  const [index, setIndex] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [dragPx, setDragPx] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const startX = React.useRef(0);

  const clamp = (i: number) => (i + banners.length) % banners.length;
  const goTo = (i: number) => setIndex(clamp(i));

  // Автопереключение раз в минуту (пауза во время перетаскивания)
  React.useEffect(() => {
    const t = setInterval(() => {
      if (!dragging) setIndex((i) => clamp(i + 1));
    }, 60_000);
    return () => clearInterval(t);
  }, [dragging, banners.length]);

  // drag / swipe
  const begin = (x: number) => { setDragging(true); startX.current = x; setDragPx(0); };
  const move  = (x: number) => { if (!dragging) return; setDragPx(x - startX.current); };
  const end   = () => {
    const w = wrapRef.current?.clientWidth || 1;
    const thr = w * 0.15;
    const d = dragPx;
    setDragging(false);
    setDragPx(0);
    if (d > thr) setIndex((i) => clamp(i - 1));
    else if (d < -thr) setIndex((i) => clamp(i + 1));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    begin(e.clientX);
    const onMove = (ev: MouseEvent) => move(ev.clientX);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      end();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  const onTouchStart = (e: React.TouchEvent) => begin(e.touches[0].clientX);
  const onTouchMove  = (e: React.TouchEvent) => move(e.touches[0].clientX);
  const onTouchEnd   = () => end();

  // позиция трека (проценты от ширины трека)
  const w = wrapRef.current?.clientWidth || 1;
  const dragPercent = (dragPx / w) * 100;
  const trackStyle: React.CSSProperties = {
    width: `${banners.length * 100}%`,
    transform: `translateX(calc(${-index * (100 / banners.length)}% + ${dragPercent / banners.length}%))`,
    transition: dragging ? 'none' : 'transform 300ms ease',
    display: 'flex',
  };

  return (
    <div className="rounded-3xl overflow-hidden border select-none">
      <div
        ref={wrapRef}
        className="relative w-full h-[424px] bg-white"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* трек */}
        <div style={trackStyle}>
          {banners.map((b, i) => (
            <a
              key={i}
              href={b.href}
              className="block w-full shrink-0 h-[424px] relative"
              onClick={(e) => { if (Math.abs(dragPx) > 5) e.preventDefault(); }}
            >
              <img
                src={b.src}
                alt={b.alt || `Banner ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </a>
          ))}
        </div>

        {/* точки-навигация */}
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              aria-label={`Перейти к баннеру ${i + 1}`}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition ${
                i === index ? 'bg-[#2777ff]' : 'bg-black/30 hover:bg-black/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** ---------------- Правый сайдбар: новости + реклама ---------------- */
export default function RightSidebar() {
  const [news, setNews] = React.useState<NewsItem[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (e) {
        console.error('Failed to load news from database:', e);
      }
    })();

    const refresh = async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (e) {
        console.error('Failed to refresh news from database:', e);
      }
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('newsUpdated', refresh as any);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('newsUpdated', refresh as any);
    };
  }, []);

  return (
    <aside className="w-[287px] shrink-0 hidden xl:block">
      <div className="sticky top-[86px] space-y-4">
        <div className="p-5 bg-white rounded-3xl border space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#111]">Новости</h3>
            <Link href="/news" className="h-8 px-3 rounded-lg bg-[#111] text-white hover:bg-[#333] text-sm flex items-center">
              Все
            </Link>
          </div>
          <div className="space-y-4">
            {news.slice(0,6).map(n => (
              <div key={n.id} className="space-y-1">
                <div className="text-sm text-[#52555a]">{new Date(n.createdAt).toLocaleDateString('ru-RU')}</div>
                <Link href={`/news/${n.slug}`} className="text-base text-[#111] leading-snug hover:underline">
                  {n.title}
                </Link>
              </div>
            ))}
            {!news.length && <div className="text-sm text-[#52555a]">Еще нет новостей</div>}
          </div>
        </div>

        {/* Реклама — без стрелок, свайп/drag + точки + автопереключение */}
        <AdsCarousel />
      </div>
    </aside>
  );
}
