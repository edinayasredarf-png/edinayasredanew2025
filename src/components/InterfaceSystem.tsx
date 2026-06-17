'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard, A11y } from 'swiper/modules';

import 'swiper/css';

type Slide = {
  src: string;
  alt: string;
};

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
    const id = setTimeout(() => {
      setNavReady(!!prevRef.current && !!nextRef.current);
    }, 0);

    return () => clearTimeout(id);
  }, []);

  return (
    <section className="w-full py-10 md:py-14 lg:py-16 font-[Raleway]">
      <div className="rd-content-column">
        {/* Header */}
        <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_1fr] md:items-start md:gap-[60px] lg:gap-[80px]">
          <h2 className="font-involve text-[#313131] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] md:leading-[44px]">
            Понятный интерфейс
          </h2>

          <p className="mt-3 md:mt-0 text-[#7c8a9a] text-[18px] md:text-[18.91px] leading-7 md:max-w-[620px]">
            Управляйте территориями, объектами и инфраструктурой —
            всё на одной цифровой платформе.
          </p>
        </div>

        {/* Viewer */}
        <div className="w-full mt-8 md:mt-10 overflow-hidden">
          <div className="relative w-full">
            <div className="relative w-full rounded-2xl overflow-hidden rd-block">
              {/* Контейнер слайдера */}
              <div className="relative w-full aspect-[1477/985] lg:h-[560px] xl:h-[720px]">
                <Swiper
                  key={String(navReady)}
                  modules={[Navigation, Keyboard, A11y]}
                  slidesPerView={1}
                  navigation={
                    navReady
                      ? {
                          prevEl: prevRef.current!,
                          nextEl: nextRef.current!,
                        }
                      : undefined
                  }
                  keyboard={{
                    enabled: true,
                    onlyInViewport: true,
                  }}
                  speed={450}
                  resistanceRatio={0.85}
                  longSwipesMs={120}
                  threshold={6}
                  className="h-full [&_.swiper-slide]:!p-0"
                >
                  {images.map((img, idx) => (
                    <SwiperSlide
                      key={idx}
                      className="!h-full !p-0"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          sizes="(max-width: 1023px) 100vw, 1280px"
                          className="object-contain object-center"
                          priority={idx === 0}
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            {/* Navigation */}
            <div className="w-[100px] mx-auto flex justify-center items-end py-[26px] select-none">
              <button
                ref={prevRef}
                aria-label="Предыдущий слайд"
                className="w-[50px] h-[60px] bg-[#029cda] rounded-tl-[50px] rounded-bl-[50px] flex justify-center items-center hover:bg-[#029cda]/90 transition-colors"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    d="M15 6l-6 6 6 6"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                ref={nextRef}
                aria-label="Следующий слайд"
                className="w-[50px] h-[60px] bg-[#029cda] rounded-tr-[50px] rounded-br-[50px] flex justify-center items-center hover:bg-[#029cda]/90 transition-colors"
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Убираем возможные внутренние padding у swiper-slide */}
      <style jsx global>{`
        .swiper-slide {
          padding: 0 !important;
        }
      `}</style>
    </section>
  );
};

export default SectionInterfaceByFigma;