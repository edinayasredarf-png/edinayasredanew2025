// components/SectionExpertise.tsx

import React from 'react';
import Image from 'next/image';

const smallCards = [
  {
    iconUrl: '/icons/platform.svg',
    alt: 'Иконка платформы',
    text: 'Комплексная платформа для управления территориями',
  },
  {
    iconUrl: '/icons/analytics.svg', // TODO: заменить на реальный URL иконки
    alt: 'Иконка аналитики',
    text: 'Инструменты для аналитики, мониторинга и планирования',
  },
  {
    iconUrl: '/icons/registry.svg', // TODO: заменить на реальный URL иконки
    alt: 'Иконка реестра ПО',
    text: 'Платформа включена в реестр отечественного ПО',
  },
];

const SectionExpertise = () => (
  <section className="py-10 lg:py-20 font-[Raleway] lining-nums">
    <div className="max-w-page mx-auto px-5 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left Big Card */}
        <a
          href="/about"
          className="group bg-white rounded-3xl p-8 flex flex-col relative overflow-hidden h-full transition-all duration-300 border border-[#fff] hover:border-[#029cda]"
          aria-label="Узнать больше о компании Единая среда — 15 лет технологической экспертизы"
        >
          <div className="relative z-10 flex flex-col flex-grow h-full w-full">
            <h2 className="text-3xl md:text-4xl lg:text-[40px] font-medium text-[#313131] leading-[1.1] ">
              15+ лет<br />технологической<br />экспертизы
            </h2>
            <div className="flex-grow" />
            <div className="mt-8 inline-flex items-center justify-center self-start px-8 py-3.5 bg-[#029cda] text-white text-lg font-medium rounded-xl group-hover:bg-opacity-80 transition-all duration-300">
              Подробнее о нас
            </div>
          </div>

          {/* Изображение — чуть меньше и ниже на десктопе */}
          <div className="hidden md:block absolute right-0 bottom-[-20px] w-[48%] max-w-[260px] h-auto z-0">
            <Image
              src="/img/es15.png"
              alt="Единая среда — 15 лет технологической экспертизы в области цифровизации территорий"
              width={260}
              height={260}
              className="w-full h-auto object-contain"
            />
          </div>
        </a>

        {/* Right Column */}
        <div className="flex flex-col gap-2 h-full">
          {/* Top Card */}
          <div className="group bg-white rounded-3xl p-4 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-5">
            <div className="order-2 md:order-1 w-full md:w-auto md:pr-2">
              <h3 className="text-xl font-medium text-[#313131] leading-snug">
                <strong>«Единая Среда»</strong> — флагманский продукт российской компании для цифровизации городов и муниципальных территорий.
              </h3>
            </div>
            <div className="order-1 md:order-2 bg-[#F6F7F9] rounded-2xl flex items-center justify-center p-2.5 w-full md:w-1/2 h-full mx-auto">
              <Image
                src="/img/logo-mobile-black.svg"
                alt="Логотип платформы Единая среда"
                width={120}
                height={60}
                className="max-w-[50%] max-h-[50%] object-contain"
              />
            </div>
          </div>

          {/* Bottom 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {smallCards.map((card, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-3xl p-5 flex flex-col gap-3 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl border border-[#E0E4EA] flex items-center justify-center transition-all duration-300 group-hover:border-[#029cda]">
                  <Image
                    src={card.iconUrl}
                    alt={card.alt}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <p className="text-base font-medium text-[#7C8A9A]">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default SectionExpertise;
