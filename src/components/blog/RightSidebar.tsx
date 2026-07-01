'use client';

import React from 'react';
import Image from 'next/image';

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
    <div className="bg-white rounded-2xl overflow-hidden">
      <div
        ref={wrapRef}
        className="relative w-full h-[424px] select-none overflow-hidden cursor-grab active:cursor-grabbing"
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
            <a key={i} href={b.href} className="block min-w-full h-[424px] relative"
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

export default function RightSidebar() {
  return (
    <aside className="w-[240px] shrink-0 hidden xl:block">
      <div className="sticky top-[86px] space-y-3 font-[Raleway] z-0">
        <AdsCarousel />
      </div>
    </aside>
  );
}
