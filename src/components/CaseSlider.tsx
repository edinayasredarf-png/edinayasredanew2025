"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

// простая карточка кейса
function CaseCard({
  title,
  textHtml,
  imageUrl,
}: {
  title: string;
  textHtml: string;
  imageUrl: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <article className="grid items-stretch gap-8 lg:grid-cols-2">
      <div className="relative overflow-hidden rounded-2xl border border-[#f2f3f8] bg-white">
        <div className="relative h-[280px] w-full sm:h-[360px]">
          {!loaded && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl bg-neutral-200">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          )}
          <Image
            src={imageUrl}
            alt={title}
            fill
            onLoad={() => setLoaded(true)}
            className="object-cover"
            sizes="(max-width:1024px) 100vw, 600px"
            priority
          />
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <h3 className="text-2xl font-extrabold text-[#142251]">{title}</h3>
        <div
          className="prose mt-4 max-w-none text-[15px] leading-relaxed prose-p:my-2 prose-strong:font-extrabold prose-strong:text-[#454445] text-[#989eb1]"
          dangerouslySetInnerHTML={{ __html: textHtml }}
        />
      </div>
    </article>
  );
}

export type CaseItem = {
  id: string | number;
  title: string;
  textHtml: string;
  imageUrl: string;
};

export default function CaseSlider({
  items,
  className = "",
}: {
  items: CaseItem[];
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);

  const max = Math.max(0, items.length - 1);

  const snapTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(max, i));
    const slide = el.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setIndex(clamped);
  };

  // отслеживаем активный слайд при ручном скролле/свайпе
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const handler = () => {
      const slides = Array.from(el.children) as HTMLElement[];
      let closest = 0;
      let closestDist = Infinity;
      slides.forEach((s, i) => {
        const rect = s.getBoundingClientRect();
        // берем левый край относительно контейнера
        const dist = Math.abs(rect.left - el.getBoundingClientRect().left);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setIndex(closest);
    };

    el.addEventListener("scroll", handler, { passive: true });
    // обновить после ресайза
    window.addEventListener("resize", handler);
    handler();

    return () => {
      el.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

  const dots = useMemo(() => new Array(items.length).fill(0), [items.length]);

  return (
    <div className={`relative ${className}`}>
      {/* Трек */}
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none]"
        aria-roledescription="carousel"
        aria-label="Кейсы"
      >
        {/* скрываем нативный скроллбар */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {items.map((item, i) => (
          <div
            key={item.id}
            className="snap-start shrink-0 basis-[100%]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} из ${items.length}`}
          >
            <CaseCard {...item} />
          </div>
        ))}
      </div>

      {/* Кнопки */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => snapTo(index - 1)}
          className="inline-grid h-12 w-12 place-items-center rounded-full border border-[#e4e7f1] bg-white text-[#2777ff] disabled:opacity-40"
          aria-label="Назад"
          disabled={index <= 0}
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => snapTo(index + 1)}
          className="inline-grid h-12 w-12 place-items-center rounded-full border border-[#e4e7f1] bg-white text-[#2777ff] disabled:opacity-40"
          aria-label="Вперёд"
          disabled={index >= max}
        >
          →
        </button>
      </div>

      {/* Точки */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {dots.map((_, i) => (
          <button
            key={i}
            aria-label={`Перейти к слайду ${i + 1}`}
            onClick={() => snapTo(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? "w-6 bg-[#2777ff]" : "w-2.5 bg-[#e4e7f1]"
            }`}
          />
        ))}
      </div>

      {/* Подсказка для клавиатуры */}
      <div className="sr-only" aria-live="polite">
        Слайд {index + 1} из {items.length}
      </div>
    </div>
  );
}
