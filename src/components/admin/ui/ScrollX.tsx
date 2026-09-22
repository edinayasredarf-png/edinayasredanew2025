"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Обёртка для горизонтально прокручиваемого контента (широкие таблицы и т.п.).
 * Показывает яркие стрелки по краям + мягкое затемнение — только с той стороны,
 * куда реально можно прокрутить. Клик по стрелке листает на ~80% ширины.
 * fade — RGB фона под краевым затемнением (по умолчанию белый).
 */
export function ScrollX({
  children, className = "", innerClassName = "", fade = "255,255,255",
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
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
    setRight(max > 1 && el.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    // Повторные замеры: после раскладки/загрузки шрифтов и на ресайз.
    const raf = requestAnimationFrame(update);
    const t = setTimeout(update, 300);
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  const btn =
    "absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 grid place-items-center rounded-full " +
    "bg-[#029cda] text-white shadow-lg ring-2 ring-white/70 hover:bg-[#0280b5] transition-colors";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={ref} className={`overflow-x-auto ${innerClassName}`}>
        {children}
      </div>

      {left && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-14 z-10"
            style={{ background: `linear-gradient(to right, rgba(${fade},1), rgba(${fade},0))` }} aria-hidden />
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Прокрутить влево" className={`${btn} left-2`}>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      {right && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 z-10"
            style={{ background: `linear-gradient(to left, rgba(${fade},1), rgba(${fade},0))` }} aria-hidden />
          <button type="button" onClick={() => scrollBy(1)} aria-label="Прокрутить вправо" className={`${btn} right-2`}>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M8 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
