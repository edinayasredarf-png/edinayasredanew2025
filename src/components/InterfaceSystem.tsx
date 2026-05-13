'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';

type Slide = { src: string; alt: string };

const images: Slide[] = [
  { src: '/img/es_interface1.webp', alt: 'Интерфейс 1' },
  { src: '/img/es_interface2.webp', alt: 'Интерфейс 2' },
  { src: '/img/es_interface3.webp', alt: 'Интерфейс 3' },
  { src: '/img/es_interface4.webp', alt: 'Интерфейс 4' },
  { src: '/img/es_interface5.webp', alt: 'Интерфейс 5' },
  { src: '/img/es_interface6.webp', alt: 'Интерфейс 6' },
];

const SectionInterfaceByFigma: React.FC = () => {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setNavReady(!!prevRef.current && !!nextRef.current), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <section className="font-[Raleway]">
      <div className="relative w-full max-w-page mx-auto px-4 sm:px-5 md:px-22 mt-16 md:mt-[120px]">
        {/* Header */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_1fr] md:items-start md:gap-[60px] lg:gap-[80px]">
          <h2 className="text-[#313131] font-medium leading-[44px] text-[32px] md:text-[39.38px]">
            Понятный интерфейс
          </h2>
          <p className="mt-3 md:mt-0 text-[#7c8a9a] text-[18px] md:text-[18.91px] leading-7 md:max-w-[620px]">
            Управляйте территориями, объектами и инфраструктурой — всё на одной цифровой платформе.
          </p>
        </div>

        {/* Viewer */}
        <div className="w-full mt-8 md:mt-10 overflow-hidden">
          <div className="relative w-full">
            <div className="relative w-full rounded-[20px] overflow-hidden bg-[#F4F5F7]">
              {/* контейнер показа */}
              <div className="relative w-full aspect-[1477/985] lg:h-[560px] xl:h-[720px]">
                <Swiper
                  key={String(navReady)}
                  modules={[Navigation, Keyboard, A11y]}
                  slidesPerView={1}
                  navigation={navReady ? { prevEl: prevRef.current!, nextEl: nextRef.current! } : undefined}
                  keyboard={{ enabled: true, onlyInViewport: true }}
                  speed={450}
                  resistanceRatio={0.85}
                  longSwipesMs={120}
                  threshold={6}
                  className="h-full [&_.swiper-slide]:!p-0"
                >
                  {images.map((img, idx) => (
                    <SwiperSlide key={idx} className="!h-full !p-0">
                      {/* ВАЖНО: абсолютное растяжение контента, без внутренних отступов */}
                      <div className="absolute inset-0">
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          sizes="(max-width: 1023px) 100vw, 1280px"
                          className="object-cover object-center"
                          priority={idx === 0}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            {/* Навигация (капсулы 50×60) */}
            <div className="w-[100px] mx-auto flex justify-center items-end py-[26px] select-none">
              <button
                ref={prevRef}
                aria-label="Предыдущий слайд"
                className="w-[50px] h-[60px] bg-[#029cda] rounded-tl-[50px] rounded-bl-[50px] flex justify-center items-center hover:bg-[#029cda]/90"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
                  <path d="M15 6l-6 6 6 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                ref={nextRef}
                aria-label="Следующий слайд"
                className="w-[50px] h-[60px] bg-[#029cda] rounded-tr-[50px] rounded-br-[50px] flex justify-center items-center hover:bg-[#029cda]/90"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
                  <path d="M9 6l6 6-6 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* На случай, если где-то остался padding у .swiper-slide — «добиваем» глобально */}
      <style jsx global>{`
        .swiper-slide { padding: 0 !important; }
      `}</style>
    </section>
  );
};

export default SectionInterfaceByFigma;
