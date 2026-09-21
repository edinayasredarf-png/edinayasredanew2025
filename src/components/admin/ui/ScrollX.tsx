"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Обёртка для горизонтально прокручиваемого контента (широкие таблицы и т.п.).
 * Показывает стрелки по краям + мягкое затемнение — только с той стороны, куда
 * реально можно прокрутить. Клик по стрелке листает на ~80% ширины.
 * fade — цвет затемнения под фон контейнера (по умолчанию белый).
 */
export function ScrollX({
  children, className = "", innerClassName = "", fade = "255,255,255",
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  /** RGB фона под краевым затемнением, напр. "246,247,249" для #F6F7F9. */
  fade?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setLeft(el.scrollLeft > 1);
    setRight(el.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  const btn =
    "absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 grid place-items-center rounded-full " +
    "bg-white shadow-md border border-gray-200 text-[#1b2a4a] hover:border-[#029cda] hover:text-[#029cda] transition-colors";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={ref} className={`overflow-x-auto [scrollbar-width:thin] ${innerClassName}`}>
        {children}
      </div>

      {left && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10"
            style={{ background: `linear-gradient(to right, rgba(${fade},1), rgba(${fade},0))` }} aria-hidden />
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Прокрутить влево" className={`${btn} left-1`}>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {right && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10"
            style={{ background: `linear-gradient(to left, rgba(${fade},1), rgba(${fade},0))` }} aria-hidden />
          <button type="button" onClick={() => scrollBy(1)} aria-label="Прокрутить вправо" className={`${btn} right-1`}>
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
