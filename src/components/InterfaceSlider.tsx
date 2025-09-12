'use client';
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface InterfaceSliderProps {
  title: string;
  subtitle: string;
  images: Array<{
    src: string;
    alt: string;
  }>;
}

const InterfaceSlider: React.FC<InterfaceSliderProps> = ({ title, subtitle, images }) => {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [navReady, setNavReady] = useState(false);

  // Ждём появления кнопок
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
    return () => {
      swiperInstance.off('slideChange', update);
    };
  }, [swiperInstance]);

  return (
    <section className="max-w-[1480px] mx-auto px-5 md:px-8 mt-16 text-black">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
                  <h2 className="font-medium text-black text-4xl md:text-4xl lg:text-2xl xl:text-4xl leading-tight">
            {title}
          </h2>
          <div className="text-black text-xl md:text-base lg:text-lg leading-7 max-w-2xl">
            {subtitle}
          </div>
      </div>
      <div className="relative w-full max-w-[1480px] mx-auto rounded-[20px] overflow-hidden">
        <Swiper
          key={navReady ? 'ready' : 'not-ready'}
          modules={[Navigation, Pagination]}
          slidesPerView={1}
          onSwiper={setSwiperInstance}
          navigation={navReady ? {
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          } : undefined}
          pagination={navReady ? { clickable: true, el: paginationRef.current } : undefined}
          className="interface-slider"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <Image src={img.src} alt={img.alt} width={1480} height={600} className="w-full h-full object-cover" />
            </SwiperSlide>
          ))}
        </Swiper>
        {/* Пагинация только на мобильных */}
        <div ref={paginationRef} className="swiper-pagination !bottom-4 !relative z-10 block md:!hidden mt-8 !flex !gap-2 !justify-center" />
        {/* Навигация стрелки снизу — только на md+ */}
        <div className="slider-navigation-buttons hidden md:flex justify-center pt-4 pb-4 z-10">
          <button
            ref={prevRef}
            aria-label="Предыдущий слайд"
            className={`slider-prev w-[50px] h-[60px] bg-[#0077FF] rounded-tl-[50px] rounded-bl-[50px] flex justify-center items-center group transition-transform duration-200 hover:bg-opacity-90 ${isBeginning ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isBeginning}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            ref={nextRef}
            aria-label="Следующий слайд"
            className={`slider-next w-[50px] h-[60px] bg-[#0077FF] rounded-tr-[50px] rounded-br-[50px] flex justify-center items-center group transition-transform duration-200 hover:bg-opacity-90 ${isEnd ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isEnd}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default InterfaceSlider;