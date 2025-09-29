'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import Button from './Button';
import { useModal } from './ModalProvider';

type Slide = { src: string; alt: string };

const images: Slide[] = [
  { src: '/img/es_interface1.webp', alt: 'Интерфейс 1' },
  { src: '/img/es_interface2.webp', alt: 'Интерфейс 2' },
  { src: '/img/es_interface3.webp', alt: 'Интерфейс 3' },
  { src: '/img/es_interface4.webp', alt: 'Интерфейс 4' },
  { src: '/img/es_interface5.webp', alt: 'Интерфейс 5' },
  { src: '/img/es_interface6.webp', alt: 'Интерфейс 6' },
];

const SectionInterfaceDemoSplit70: React.FC = () => {
  const { openDemo } = useModal();

  // --- breakpoint: isMobile (< md) ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // --- base swiper ---
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [navReady, setNavReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setNavReady(!!prevRef.current && !!nextRef.current && !!paginationRef.current);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!swiperInstance) return;
    const update = () => {
      setIsBeginning(swiperInstance.isBeginning);
      setIsEnd(swiperInstance.isEnd);
      setActiveIndex(swiperInstance.realIndex ?? swiperInstance.activeIndex ?? 0);
    };
    swiperInstance.on('slideChange', update);
    update();
    return () => {
      swiperInstance.off('slideChange', update);
    };
  }, [swiperInstance]);

  // --- lightbox ---
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isLightboxOpen]);

  const openLightbox = useCallback((index: number) => {
    if (isMobile) return; // запрет на мобилке
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, [isMobile]);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLightboxOpen, closeLightbox]);

  return (
    <section className="max-w-[1480px] mx-auto px-5 md:px-8 mt-16 text-black">
      {/* Заголовок */}
      <div className="max-w-3xl mb-8">
        <h2 className="font-medium text-3xl md:text-4xl leading-tight">Понятный интерфейс</h2>
        <p className="mt-3 text-black/80 text-lg md:text-xl">Управляйте территориями, объектами и инфраструктурой — всё в одной цифровой платформе.</p>
      </div>

      {/* 70/30; фикс высота только на десктопе, на планшете — авто */}
      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-2 lg:gap-2 items-stretch lg:h-[620px] xl:h-[650px]">
        {/* LEFT 70% */}
        <div className="relative rounded-[20px] overflow-hidden bg-[#F4F5F7] h-[340px] sm:h-[380px] md:h-[460px] lg:h-auto">
          <div className="relative w-full h-full">
            {/* Иконка «на весь экран»: скрыта на мобилке */}
            <button
              type="button"
              onClick={() => openLightbox(activeIndex)}
              aria-label="Открыть изображение на весь экран"
              className="hidden md:inline-flex absolute top-3 right-3 z-20 items-center justify-center h-10 w-10 rounded-full bg-black/40 hover:bg-black/50 text-white backdrop-blur"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M14 5h5v5M19 5l-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 19H5v-5M5 19l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <Swiper
              key={String(navReady)}
              modules={[Navigation, Pagination, Keyboard, A11y]}
              slidesPerView={1}
              onSwiper={setSwiperInstance}
              navigation={navReady ? { prevEl: prevRef.current, nextEl: nextRef.current } : undefined}
              pagination={navReady ? { clickable: true, el: paginationRef.current, dynamicBullets: false } : undefined}
              keyboard={{ enabled: true, onlyInViewport: true }}
              speed={450}
              resistanceRatio={0.85}
              longSwipesMs={120}
              threshold={6}
              grabCursor
              style={{ height: '100%' }}
              className="interface-slider h-full"
            >
              {images.map((img, idx) => (
                <SwiperSlide key={idx} className="!h-full">
                  {/* На моб/планшете явная высота, на десктопе — по строке грида */}
                  <div
                    onClick={!isMobile ? () => openLightbox(idx) : undefined}
                    className="relative h-[340px] sm:h-[380px] md:h-[460px] lg:h-full w-full flex items-center justify-center md:cursor-zoom-in"
                    role="img"
                    aria-label={img.alt}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(max-width: 1023px) 100vw, (max-width: 1535px) 70vw, 1036px"
                        className="object-contain"
                        priority={idx === 0}
                      />
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Пагинация — только мобилка: центр и перенос при нехватке места */}
            <div ref={paginationRef} className="swiper-pagination md:!hidden absolute bottom-3 inset-x-0 w-full z-20 flex items-center justify-center" />

            {/* Стрелки — только md+ */}
            <div className="hidden md:flex items-center justify-center gap-0 pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
              <button ref={prevRef} aria-label="Предыдущий слайд" className={`pointer-events-auto w-[50px] h-[56px] bg-[#0077FF] rounded-l-[50px] flex justify-center items-center transition hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 ${isBeginning ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isBeginning}>
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d="M15 6l-6 6 6 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button ref={nextRef} aria-label="Следующий слайд" className={`pointer-events-auto w-[50px] h-[56px] bg-[#0077FF] rounded-r-[50px] flex justify-center items-center transition hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 ${isEnd ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isEnd}>
                <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden><path d="M9 6l6 6-6 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT 30% */}
        <aside className="relative rounded-[20px] overflow-hidden bg-[#0077FF] text-white p-5 md:p-7 flex flex-col h-full">
          <Image src="/img/ellipse.webp" alt="" fill className="object-cover opacity-55 pointer-events-none select-none" />
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-semibold leading-tight">Бесплатная демонстрация системы</h3>
            <p className="mt-3 text-white/90">Посмотрим ваши процессы и покажем, как «Единая Среда» ускоряет инвентаризацию, контроль и отчётность.</p>
          </div>
          <div className="relative z-10 mt-auto pt-6">
            <Button onClick={openDemo} variant="primary" size="large" className="w-full bg-white hover:bg-white/90 !text-[#0077FF] focus:outline-none focus:ring-4 focus:ring-white/40">Протестировать</Button>
            <p className="mt-3 text-xs text-white/70 text-center">Демо 20–30 минут. Онлайн в удобной ВКС-платформе.</p>
          </div>
        </aside>
      </div>

      {/* LIGHTBOX: полностью отключается на мобилке */}
      {isLightboxOpen && !isMobile && (
        <div className="fixed inset-0 z-[100] w-screen h-screen bg-black/90 backdrop-blur-[1px]">
          <button aria-label="Закрыть" onClick={closeLightbox} className="absolute top-3 right-3 md:top-6 md:right-6 h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-[110]">
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6l-12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>

          <div className="absolute inset-0">
            <Swiper
              initialSlide={lightboxIndex}
              modules={[Navigation, Pagination, Keyboard, A11y]}
              slidesPerView={1}
              navigation={{ enabled: true }}
              pagination={{ clickable: true, dynamicBullets: false }}
              keyboard={{ enabled: true }}
              className="w-screen h-screen"
            >
              {images.map((img, i) => (
                <SwiperSlide key={`lb-${i}`} className="!w-screen !h-screen">
                  <div className="relative w-screen h-screen">
                    <Image src={img.src} alt={img.alt} fill sizes="100vw" className="object-contain" priority />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

      <style jsx global>{`
        .interface-slider .swiper-pagination-bullet { transition: transform .25s cubic-bezier(.2,.8,.2,1), background-color .25s; margin: 0 6px !important; }
        .interface-slider .swiper-pagination { display: flex; flex-wrap: wrap; gap: 4px 0; justify-content: center; }
        .interface-slider .swiper-pagination-bullet-active { transform: scale(1.2); }
      `}</style>
    </section>
  );
};

export default SectionInterfaceDemoSplit70;