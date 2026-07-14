"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { listPress, PressItem } from "@/lib/pressStore";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={dir === "right" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
    </svg>
  );
}

export default function PressSection() {
  const [items, setItems] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    listPress()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [items, updateArrows]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : 316;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white" aria-label="СМИ о нас">
      <div className="rd-content-column">
        <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-involve font-medium leading-tight tracking-tight text-[#1a1a1a] mb-3">
          СМИ о нас
        </h2>
        <p className="text-[#6b7280] text-[17px] mb-10">
          Публикации в ведущих изданиях об «Единой среде»
        </p>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-[280px] sm:w-[300px] bg-[#F6F7F9] rounded-2xl p-5 h-[180px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="relative">
            <div
              ref={scrollerRef}
              onScroll={updateArrows}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-card
                  className="group shrink-0 snap-start w-[280px] sm:w-[300px] bg-[#F6F7F9] rounded-2xl p-5 flex flex-col justify-between min-h-[180px]"
                >
                  {/* Логотип источника */}
                  <div className="mb-4 h-9 flex items-center">
                    {item.source_logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.source_logo}
                        alt={item.source_name}
                        className="max-h-9 w-auto object-contain"
                      />
                    ) : (
                      <span className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wide">
                        {item.source_name}
                      </span>
                    )}
                  </div>

                  {/* Заголовок */}
                  <p className="text-[#1a1a1a] text-[15px] font-medium leading-snug line-clamp-3 flex-1 mb-4">
                    {item.title}
                  </p>

                  {/* Дата + стрелка */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#9ca3af]">
                      {new Date(Number(item.published_at)).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-[#029cda] opacity-0 group-hover:opacity-100 transition-opacity text-[13px] font-medium flex items-center gap-1">
                      Читать
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                </a>
              ))}
            </div>

            {/* Стрелки — только когда есть что листать */}
            {canLeft && (
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label="Предыдущие публикации"
                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-[#029cda] text-white items-center justify-center shadow-lg hover:bg-[#0288bd] transition-colors"
              >
                <Chevron dir="left" />
              </button>
            )}
            {canRight && (
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label="Следующие публикации"
                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-[#029cda] text-white items-center justify-center shadow-lg hover:bg-[#0288bd] transition-colors"
              >
                <Chevron dir="right" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
