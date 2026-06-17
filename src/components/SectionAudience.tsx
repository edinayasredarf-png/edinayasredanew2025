'use client';

import React from 'react';
import Image from 'next/image';

const cards = [
  {
    title: 'Муниципалитеты',
    img: '/img/audience/municipal.png',
    alt: 'Муниципалитеты',
  },
  {
    title: 'Ритуальные службы',
    img: '/img/audience/ritual.png',
    alt: 'Ритуальные службы',
  },
  {
    title: 'Застройщики',
    img: '/img/audience/developer.png',
    alt: 'Застройщики',
  },
  {
    title: 'Управляющие\nкомпании ЖКХ',
    img: '/img/audience/zhkh.png',
    alt: 'Управляющие компании ЖКХ',
  },
  {
    title: 'Отели и санатории',
    img: '/img/audience/hotel.png',
    alt: 'Отели и санатории',
  },
  {
    title: 'Крупные\nтерриториальные\nкомплексы',
    img: '/img/audience/complex.png',
    alt: 'Крупные территориальные комплексы',
  },
];

const SectionAudience: React.FC = () => {
  return (
    <section className="w-full py-10 md:py-14 lg:py-16">
      <div className="rd-content-column">
        {/* Заголовок */}
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

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {cards.map((card) => (
            <div
              key={card.alt}
              className="bg-white rounded-3xl flex flex-col overflow-hidden min-h-[352px]"
            >
              {/* Заголовок карточки */}
              <div className="px-10 pt-10 pb-4">
                <h3 className="font-involve text-[#222222] text-2xl font-bold leading-8 whitespace-pre-line">
                  {card.title}
                </h3>
              </div>

              {/* Изображение */}
              <div className="flex-1 flex items-end justify-center px-10 pb-6">
                <div className="relative w-full h-[200px]">
                  <Image
                    src={card.img}
                    alt={card.alt}
                    fill
                    className="object-contain object-bottom"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionAudience;
