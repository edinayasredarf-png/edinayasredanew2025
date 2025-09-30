'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NewsItem, sb_listNews } from '@/lib/blogStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function HomeNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
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
        setItems(all);
      } catch (e) {
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
    <section className="py-10 lg:py-20">
      <div className="max-w-[1480px] mx-auto px-5 md:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-center text-black text-2xl md:text-4xl lg:text-[50px] font-medium leading-[1.1] mb-0">
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
          >
            {items.map(n => (
              <SwiperSlide key={n.id}>
                <Link href={`/news/${n.slug}`} className="bg-white rounded-3xl p-8 h-full flex flex-col min-h-[200px] border border-[#E5E7EB] hover:border-[#0077FF]">
                  <p className="text-lg text-gray-500 mb-2">{new Date(n.createdAt).toLocaleDateString('ru-RU')}</p>
                  <h3 className="text-2xl font-bold text-black mb-4 flex-grow">{n.title}</h3>
                  {!!(n.tags?.length) && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {n.tags!.map(t => <span key={t} className="text-sm text-[#2777ff]">#{t}</span>)}
                    </div>
                  )}
                  <span className="group mt-6 self-start inline-flex items-center gap-2 text-[#0077FF] font-medium">
                    <span>Читать</span>
                    <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </span>
                </Link>
              </SwiperSlide>
            ))}
            {/* Последний слайд: кнопка Все новости, такой же размер и скругления, в конце списка */}
            <SwiperSlide>
              <Link href="/news" className="bg-[#0077FF] rounded-3xl p-8 h-full min-h-[200px] flex items-center justify-center text-white text-xl font-medium hover:bg-[#0063d4]">
                Открывать все новости
              </Link>
            </SwiperSlide>
          </Swiper>

          <div ref={paginationRef} className="swiper-pagination !bottom-4 !relative z-10 block md:!hidden mt-8 !flex !gap-2 !justify-center" />

          <div className="slider-navigation-buttons hidden md:flex justify-center pt-4 pb-4 z-10">
            <button ref={prevRef} aria-label="Предыдущий слайд" className={`slider-prev w-[50px] h-[60px] bg-[#0077FF] rounded-tl-[50px] rounded-bl-[50px] flex justify-center items-center group transition-transform duration-200 hover:bg-opacity-90 ${isBeginning ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isBeginning}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button ref={nextRef} aria-label="Следующий слайд" className={`slider-next w-[50px] h-[60px] bg-[#0077FF] rounded-tr-[50px] rounded-br-[50px] flex justify-center items-center group transition-transform duration-200 hover:bg-opacity-90 ${isEnd ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isEnd}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        
      </div>
    </section>
  );
}


