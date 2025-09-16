'use client';

import React from 'react';
import Link from 'next/link';
import { sb_listNews, NewsItem } from '@/lib/blogStore';

/* ================== Карусель без стрелок ================== */
type Banner = { src: string; href: string; alt?: string };

function AdsCarousel() {
  // Фиксированный порядок и постоянные ссылки
  const banners = React.useMemo<Banner[]>(
    () => [
      { src: '/img/ads/banner1.png', href: '/',          alt: 'Реклама 1' },
      { src: '/img/ads/banner2.png', href: '/',          alt: 'Реклама 2' },
      { src: '/img/ads/banner3.png', href: '/services',  alt: 'Реклама 3' },
    ],
    []
  );

  const [index, setIndex] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [dragPx, setDragPx] = React.useState(0);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const startX = React.useRef(0);
  const wasDragged = React.useRef(false);

  const clamp = (i: number) => (i + banners.length) % banners.length;
  const goTo  = (i: number) => setIndex(clamp(i));

  // Автопереключение раз в минуту (пауза во время перетаскивания)
  React.useEffect(() => {
    const t = setInterval(() => {
      if (!dragging) setIndex((i) => clamp(i + 1));
    }, 60_000);
    return () => clearInterval(t);
  }, [dragging]);

  // Перетаскивание мышью
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    setDragging(true);
    setDragPx(0);
    wasDragged.current = false;

    const handleMove = (ev: MouseEvent) => {
      const d = ev.clientX - startX.current;
      if (Math.abs(d) > 3) wasDragged.current = true;
      setDragPx(d);
    };
    const handleUp = () => {
      finishDrag();
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Перетаскивание на тач-экранах
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
    setDragPx(0);
    wasDragged.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const d = e.touches[0].clientX - startX.current;
    if (Math.abs(d) > 3) wasDragged.current = true;
    setDragPx(d);
  };
  const onTouchEnd = () => finishDrag();

  const finishDrag = () => {
    const w = wrapRef.current?.clientWidth || 1;
    const THR = Math.max(40, w * 0.15); // порог
    const d = dragPx;
    setDragging(false);
    setDragPx(0);
    if (d > THR) setIndex((i) => clamp(i - 1));
    else if (d < -THR) setIndex((i) => clamp(i + 1));
  };

  // Ширина обёртки нужна для расчёта transform
  const w = wrapRef.current?.clientWidth || 0;
  const trackStyle: React.CSSProperties = {
    display: 'flex',
    transform: `translateX(${dragPx - index * w}px)`,
    transition: dragging ? 'none' : 'transform 350ms ease',
    willChange: 'transform',
  };

  return (
    <div className="rounded-3xl overflow-hidden border">
      <div
        ref={wrapRef}
        className="relative w-full h-[424px] bg-white select-none overflow-hidden"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Трек со слайдами */}
        <div style={trackStyle}>
          {banners.map((b, i) => (
            <a
              key={i}
              href={b.href}
              className="block min-w-full h-[424px] relative"
              // блокируем клик, если был drag — иначе по свайпу переходила бы ссылка
              onClick={(e) => { if (wasDragged.current) e.preventDefault(); }}
            >
              <img
                src={b.src}
                alt={b.alt || `Баннер ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </a>
          ))}
        </div>

        {/* Точки навигации */}
        <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              aria-label={`Перейти к баннеру ${i + 1}`}
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition
                ${i === index ? 'bg-[#2777ff]' : 'bg-black/30 hover:bg-black/50'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================== Правый сайдбар ================== */
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

        {/* Рекламный блок с свайпом и точками */}
        <AdsCarousel />
      </div>
    </aside>
  );
}
