'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { sb_listNews, NewsItem } from '@/lib/blogStore';
import { formatContentDate } from '@/lib/contentDates';

type Banner = { src: string; href: string; alt?: string };

function AdsCarousel() {
  const banners: Banner[] = [
    { src: '/img/ads/banner1.png', href: '/', alt: 'Реклама 1' },
    { src: '/img/ads/banner2.png', href: '/', alt: 'Реклама 2' },
    { src: '/img/ads/banner3.png', href: '/services', alt: 'Реклама 3' },
  ];

  const [index, setIndex] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const startX = React.useRef(0);
  const [dragPx, setDragPx] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const wasDragged = React.useRef(false);

  const clamp = (i: number) => (i + banners.length) % banners.length;

  React.useEffect(() => {
    const t = setInterval(() => { if (!dragging) setIndex(i => clamp(i + 1)); }, 5000);
    return () => clearInterval(t);
  }, [dragging]);

  const finishDrag = () => {
    const w = wrapRef.current?.clientWidth || 1;
    if (dragPx > w * 0.15) setIndex(i => clamp(i - 1));
    else if (dragPx < -w * 0.15) setIndex(i => clamp(i + 1));
    setDragging(false);
    setDragPx(0);
  };

  const w = wrapRef.current?.clientWidth || 0;

  return (
    <div className="bg-white rounded-2xl border border-[#e8eaed] overflow-hidden">
      <div
        ref={wrapRef}
        className="relative w-full h-[200px] select-none overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={e => { startX.current = e.clientX; setDragging(true); setDragPx(0); wasDragged.current = false;
          const mm = (ev: MouseEvent) => { const d = ev.clientX - startX.current; if (Math.abs(d) > 3) wasDragged.current = true; setDragPx(d); };
          const mu = () => { finishDrag(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
          window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
        }}
        onTouchStart={e => { startX.current = e.touches[0].clientX; setDragging(true); setDragPx(0); }}
        onTouchMove={e => { const d = e.touches[0].clientX - startX.current; if (Math.abs(d) > 3) wasDragged.current = true; setDragPx(d); }}
        onTouchEnd={finishDrag}
      >
        <div
          style={{
            display: 'flex',
            transform: `translateX(${dragPx - index * w}px)`,
            transition: dragging ? 'none' : 'transform 350ms ease',
          }}
        >
          {banners.map((b, i) => (
            <a key={i} href={b.href} className="block min-w-full h-[200px] relative"
              onClick={e => { if (wasDragged.current) e.preventDefault(); }}>
              <Image src={b.src} alt={b.alt || `Баннер ${i + 1}`} fill className="object-cover" sizes="260px" draggable={false} />
            </a>
          ))}
        </div>
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/50'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

let _newsCache: NewsItem[] | null = null;

export default function RightSidebar() {
  const [news, setNews] = React.useState<NewsItem[]>(_newsCache || []);
  const [loading, setLoading] = React.useState(_newsCache === null);

  React.useEffect(() => {
    if (_newsCache) { setLoading(false); return; }
    sb_listNews().then(d => { _newsCache = d; setNews(d); }).catch(() => {}).finally(() => setLoading(false));
    const refresh = () => sb_listNews().then(d => setNews(d)).catch(() => {});
    window.addEventListener('focus', refresh);
    window.addEventListener('newsUpdated', refresh as EventListener);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('newsUpdated', refresh as EventListener); };
  }, []);

  return (
    <aside className="w-[260px] shrink-0 hidden xl:block">
      <div className="sticky top-[76px] space-y-3 font-[Raleway]">

        {/* Блок новостей */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#313131]">Новости</h3>
            <Link href="/news" className="text-[12px] text-[#029cda] hover:text-[#0280b5] flex items-center gap-0.5 font-medium">
              Все
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              {news.slice(0, 6).map(n => (
                <div key={n.id}>
                  <div className="text-[11px] text-[#8c9099] mb-0.5">{formatContentDate(n.createdAt, n.updatedAt)}</div>
                  <Link href={`/news/${n.slug}`} className="text-[13px] text-[#313131] leading-snug hover:text-[#029cda] transition-colors line-clamp-2 font-medium">
                    {n.title}
                  </Link>
                </div>
              ))}
              {!news.length && <div className="text-[13px] text-[#8c9099]">Новостей пока нет</div>}
            </div>
          )}
        </div>

        {/* Рекламный баннер */}
        <AdsCarousel />

        {/* Соцсети */}
        <div className="bg-white rounded-2xl border border-[#e8eaed] p-4">
          <div className="text-[13px] font-semibold text-[#313131] mb-2.5">Подписывайтесь</div>
          <div className="flex gap-2">
            <a href="https://vk.com/edinayasredarf" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#f5f6f8] hover:bg-[#e8eaed] transition-colors text-[13px] font-medium text-[#52555a]">
              <Image src="/icons/vk.svg" alt="VK" width={15} height={15} /> ВК
            </a>
            <a href="https://t.me/edinayasredarf" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#f5f6f8] hover:bg-[#e8eaed] transition-colors text-[13px] font-medium text-[#52555a]">
              <Image src="/icons/tg.svg" alt="Telegram" width={15} height={15} /> TG
            </a>
            <a href="https://dzen.ru/edinayasreda" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-[#f5f6f8] hover:bg-[#e8eaed] transition-colors text-[13px] font-medium text-[#52555a]">
              <Image src="/icons/dzen.svg" alt="Дзен" width={15} height={15} /> Дзен
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
