'use client';

import React from 'react';
import { listAds, AdBanner } from '@/lib/adsStore';

function AdsCarousel({ banners }: { banners: AdBanner[] }) {
  const [index, setIndex] = React.useState(0);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const startX = React.useRef(0);
  const [dragPx, setDragPx] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const wasDragged = React.useRef(false);

  const clamp = (i: number) => (i + banners.length) % banners.length;
  const multiple = banners.length > 1;

  React.useEffect(() => {
    if (!multiple) return;
    const t = setInterval(() => { if (!dragging) setIndex(i => clamp(i + 1)); }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, multiple, banners.length]);

  const finishDrag = () => {
    if (!multiple) { setDragging(false); setDragPx(0); return; }
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
        className={`relative w-full h-[424px] select-none overflow-hidden ${multiple ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={multiple ? e => { startX.current = e.clientX; setDragging(true); setDragPx(0); wasDragged.current = false;
          const mm = (ev: MouseEvent) => { const d = ev.clientX - startX.current; if (Math.abs(d) > 3) wasDragged.current = true; setDragPx(d); };
          const mu = () => { finishDrag(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
          window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
        } : undefined}
        onTouchStart={multiple ? e => { startX.current = e.touches[0].clientX; setDragging(true); setDragPx(0); } : undefined}
        onTouchMove={multiple ? e => { const d = e.touches[0].clientX - startX.current; if (Math.abs(d) > 3) wasDragged.current = true; setDragPx(d); } : undefined}
        onTouchEnd={multiple ? finishDrag : undefined}
      >
        <div
          style={{
            display: 'flex',
            transform: `translateX(${dragPx - index * w}px)`,
            transition: dragging ? 'none' : 'transform 350ms ease',
          }}
        >
          {banners.map((b, i) => {
            const content = (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.image} alt={b.alt || `Баннер ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
            );
            return b.href ? (
              <a key={b.id} href={b.href} target={/^https?:\/\//.test(b.href) ? '_blank' : undefined}
                rel={/^https?:\/\//.test(b.href) ? 'noopener noreferrer' : undefined}
                className="block min-w-full h-[424px] relative"
                onClick={e => { if (wasDragged.current) e.preventDefault(); }}>
                {content}
              </a>
            ) : (
              <div key={b.id} className="block min-w-full h-[424px] relative">{content}</div>
            );
          })}
        </div>
        {multiple && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RightSidebar() {
  const [banners, setBanners] = React.useState<AdBanner[] | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listAds();
        if (alive) setBanners(list.filter(b => b.image));
      } catch {
        if (alive) setBanners([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Пока загружаем или если баннеров нет — панель не показываем вовсе.
  if (!banners || banners.length === 0) return null;

  return (
    <aside className="w-[240px] shrink-0 hidden xl:block">
      <div className="sticky top-[86px] space-y-3 font-[Raleway] z-0">
        <AdsCarousel banners={banners} />
      </div>
    </aside>
  );
}
