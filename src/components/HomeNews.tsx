'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NewsItem, sb_listNews } from '@/lib/blogStore';
import { formatContentDate } from '@/lib/contentDates';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

let _homeNewsCache: NewsItem[] | null = null;

export default function HomeNews() {
  const [items, setItems] = useState<NewsItem[]>(_homeNewsCache || []);
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const all = await sb_listNews();
        _homeNewsCache = all;
        setItems(all);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  useEffect(() => {
    setNavReady(!!prevRef.current && !!nextRef.current && !!paginationRef.current);
  }, [prevRef.current, nextRef.current, paginationRef.current]);

  useEffect(() => {
    if (!swiperInstance) return;
    const update = () => {
      setIsBeginning(swiperInstance.isBeginning);
      setIsEnd(swiperInstance.isEnd);
    };
    swiperInstance.on('slideChange', update);
    update();
    return () => { swiperInstance.off('slideChange', update); };
  }, [swiperInstance]);

  if (!items.length) return null;

  return (
    <section className="bg-white w-full py-10 md:py-14 lg:py-16 font-raleway lining-nums">
      <div className="rd-content-column">
        <div className="mb-8 md:mb-10">
          <h2 className="font-involve text-[#313131] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2]">
            Новости
          </h2>
        </div>

        <div className="relative">
          <Swiper
            key={navReady ? 'ready' : 'not-ready'}
            modules={[Navigation, Pagination]}
            slidesPerView={1}
            spaceBetween={24}
            onSwiper={setSwiperInstance}
            navigation={navReady ? { prevEl: prevRef.current, nextEl: nextRef.current } : undefined}
            pagination={navReady ? { clickable: true, el: paginationRef.current } : undefined}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="[&_.swiper-slide]:!h-auto"
          >
            {items.map((n) => (
              <SwiperSlide key={n.id}>
                {/* ЕДИНЫЙ РАЗМЕР БЛОКА: совпадает с блоком «Открыть все новости» */}
                <Link
                  href={`/news/${n.slug}`}
                  className="rd-block rounded-2xl p-8 border border-transparent hover:ring-1 hover:ring-[#029cda] transition-colors min-h-[200px] h-full flex flex-col"
                >
                  <p className="text-sm md:text-medium text-[#313131] mb-2">
                    {formatContentDate(n.createdAt, n.updatedAt)}
                  </p>
                  <h3 className="text-xl md:text-2xl font-medium text-[#313131] mb-4 line-clamp-3">
                    {n.title}
                  </h3>
                  {!!(n.tags?.length) && (
                    <div className="mt-auto pt-2 flex flex-wrap gap-2">
                      {n.tags!.map((t) => (
                        <span key={t} className="text-sm text-[#029cda]">#{t}</span>
                      ))}
                    </div>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 text-[#029cda] font-medium">
                    <span>Читать</span>
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </span>
                </Link>
              </SwiperSlide>
            ))}

            {/* Последний слайд — «Все новости» (эталон размера) */}
            <SwiperSlide>
              <Link
                href="/news"
                className="bg-[#029cda] rounded-3xl p-8 text-white text-lg md:text-xl font-medium hover:bg-[#029cda]/90 transition-colors min-h-[200px] h-full flex items-center justify-center"
              >
                Открыть все новости
              </Link>
            </SwiperSlide>
          </Swiper>

          {/* Пагинация — мобайл */}
          <div
            ref={paginationRef}
            className="swiper-pagination !bottom-4 !relative z-10 block md:!hidden mt-8 !flex !gap-2 !justify-center"
          />

          {/* Стрелки */}
          <div className="hidden md:flex justify-center pt-4 pb-4 z-10">
            <button
              ref={prevRef}
              aria-label="Предыдущий слайд"
              className={`w-[50px] h-[60px] bg-[#029cda] rounded-tl-[50px] rounded-bl-[50px] flex justify-center items-center transition-colors hover:bg-opacity-90 ${isBeginning ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isBeginning}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              ref={nextRef}
              aria-label="Следующий слайд"
              className={`w-[50px] h-[60px] bg-[#029cda] rounded-tr-[50px] rounded-br-[50px] flex justify-center items-center transition-colors hover:bg-opacity-90 ${isEnd ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isEnd}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* line-clamp на всякий случай */}
      <style jsx global>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}
