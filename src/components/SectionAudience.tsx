'use client';

import React from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import 'swiper/css';

const cards = [
  {
    title: 'Муниципалитеты',
    img: '/img/audience/municipal.webp',
    alt: 'Муниципалитеты',
  },
  {
    title: 'Ритуальные службы',
    img: '/img/audience/ritual.webp',
    alt: 'Ритуальные службы',
  },
  {
    title: 'Застройщики',
    img: '/img/audience/developer.webp',
    alt: 'Застройщики',
  },
  {
    title: 'Управляющие\nкомпании ЖКХ',
    img: '/img/audience/zhkh.webp',
    alt: 'Управляющие компании ЖКХ',
  },
  {
    title: 'Отели и санатории',
    img: '/img/audience/hotel.webp',
    alt: 'Отели и санатории',
  },
  {
    title: 'Крупные\nтерриториальные\nкомплексы',
    img: '/img/audience/complex.webp',
    alt: 'Крупные территориальные комплексы',
  },
];

const CardContent: React.FC<{ title: string; img: string; alt: string }> = ({ title, img, alt }) => (
  <div className="bg-white rounded-3xl flex flex-col h-full min-h-[320px]">
    <div className="px-8 pt-8 pb-4">
      <h3 className="font-involve text-[#222222] text-2xl font-bold leading-8 whitespace-pre-line">
        {title}
      </h3>
    </div>
    <div className="flex-1 flex items-end justify-center px-8 pb-6">
      <div className="relative w-full h-[190px]">
        <Image
          src={img}
          alt={alt}
          fill
          className="object-contain object-bottom"
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
    </div>
  </div>
);

const SectionAudience: React.FC = () => {
  return (
    <section className="w-full py-10 md:py-14 lg:py-16">
      {/* Заголовок — внутри rd-content-column */}
      <div className="rd-content-column">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-involve text-[#222222] text-[clamp(2rem,4.5vw,3rem)] leading-[1.14] font-bold">
            Кому подходит{' '}
            <br className="hidden sm:block" />
            Единая Среда
          </h2>
          <p className="mt-5 text-[#222222] text-lg md:text-xl leading-[1.5] font-[Raleway] max-w-[680px] mx-auto">
            Управляйте территориями, объектами инфраструктуры и подрядчиками в единой цифровой
            системе — независимо от масштаба организации.
          </p>
        </div>
      </div>

      {/* Мобильный слайдер — overflow-hidden на обёртке блокирует горизонтальный скролл страницы */}
      <div className="lg:hidden overflow-hidden">
        <div className="pl-4 sm:pl-6">
        <Swiper
          modules={[FreeMode]}
          slidesPerView={1.15}
          spaceBetween={8}
          freeMode
          breakpoints={{
            480: { slidesPerView: 1.5, spaceBetween: 8 },
            640: { slidesPerView: 2.1, spaceBetween: 8 },
          }}
        >
          {cards.map((card) => (
            <SwiperSlide key={card.alt} className="!h-auto">
              <CardContent {...card} />
            </SwiperSlide>
          ))}
        </Swiper>
        </div>
      </div>

      {/* Десктоп — обычная сетка */}
      <div className="rd-content-column hidden lg:block">
        <div className="grid grid-cols-3 gap-2">
          {cards.map((card) => (
            <CardContent key={card.alt} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionAudience;
