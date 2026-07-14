"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { CaseItem, sb_listCases } from "@/lib/blogStore";
import { resolveCaseCover } from "@/lib/caseCover";

let _homeCasesCache: CaseItem[] | null = null;

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={dir === "right" ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
    </svg>
  );
}

export default function HomeCases() {
  const [cases, setCases] = useState<CaseItem[]>(_homeCasesCache || []);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await sb_listCases();
        const sorted = [...data].sort((a, b) => b.createdAt - a.createdAt);
        _homeCasesCache = sorted;
        setCases(sorted);
      } catch {
        setCases([]);
      }
    })();
  }, []);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    // пересчёт после загрузки кейсов / ресайза
    updateArrows();
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [cases, updateArrows]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 16 : 385;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!cases.length) return null;

  return (
    <section className="bg-white w-full py-16 md:py-24 overflow-hidden" aria-label="Кейсы клиентов">
      <div className="rd-content-column">
        {/* Заголовок + подзаголовок */}
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[1120px] font-involve text-[#050c26] text-[32px] md:text-[40px] font-medium leading-[1.15] md:leading-[44px] tracking-wide">
            Как наши клиенты используют
            <br className="hidden sm:block" />
            {" "}Единую среду для своего роста
          </h2>
          <p className="mt-4 max-w-[680px] font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
            Почитайте истории успеха клиентов нашей системы.
          </p>
        </div>

        {/* Слайдер */}
        <div className="relative mt-8">
          <div
            ref={scrollerRef}
            onScroll={updateArrows}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {cases.map((item) => {
              const cover = resolveCaseCover(item.cover, item.contentHtml);
              return (
                <Link
                  key={item.id}
                  href={`/cases/${item.slug}`}
                  data-card
                  className="group shrink-0 snap-start flex flex-col w-[300px] sm:w-[340px] lg:w-[369px] h-[400px] bg-[#F6F7F9] rounded-[32px] pt-5 pb-8"
                >
                  <div className="mx-5 relative h-[194px] rounded-[20px] overflow-hidden bg-[#ebebeb]">
                    <Image
                      src={cover}
                      alt=""
                      fill
                      className="object-cover object-center"
                      sizes="330px"
                    />
                  </div>
                  <h3 className="mt-6 mx-10 font-involve text-[#050c26] text-xl font-medium leading-7 tracking-wide line-clamp-3">
                    {item.title}
                  </h3>
                  <span className="mt-auto mx-10 text-[#029cda] text-lg font-medium font-involve leading-7 group-hover:underline">
                    Подробнее
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Стрелки — левая появляется только после прокрутки */}
          {canLeft && (
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Предыдущие кейсы"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-[#029cda] text-white items-center justify-center shadow-lg hover:bg-[#0288bd] transition-colors"
            >
              <Chevron dir="left" />
            </button>
          )}
          {canRight && (
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Следующие кейсы"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-[#029cda] text-white items-center justify-center shadow-lg hover:bg-[#0288bd] transition-colors"
            >
              <Chevron dir="right" />
            </button>
          )}
        </div>

        {/* Кнопка «Больше кейсов» */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/cases"
            className="w-full max-w-[369px] h-[52px] inline-flex items-center justify-center rounded-2xl bg-[#F6F7F9] text-[#029cda] text-base font-medium font-involve leading-6 tracking-tight hover:bg-[#eef0f3] transition-colors"
          >
            Больше кейсов
          </Link>
        </div>
      </div>
    </section>
  );
}
