import React from 'react';
import Image from 'next/image';

const smallCards = [
  {
    icon: (
      <svg className="w-8 h-8 text-[#0077FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4a2 2 0 012-2h6a2 2 0 012 2v4m-6 0h-2" />
      </svg>
    ),
    text: 'Комплексная платформа для управления территориями',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-[#0077FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    text: 'Инструменты для аналитики, мониторинга и планирования',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-[#0077FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    text: 'Платформа включена в реестр отечественного ПО',
  },
];

const SectionExpertise = () => (
  <section className="py-10 lg:py-20">
    <div className="max-w-[1480px] mx-auto px-5 md:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Big Card */}
        <a
          href="/about"
          className="group bg-white rounded-3xl p-8 flex flex-col relative overflow-hidden h-full transition-all duration-300 outline outline-1 outline-transparent hover:outline-[#0077FF]"
        >
          <div className="relative z-10 flex flex-col flex-grow h-full w-full">
            <h3 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-black leading-tight">
              15+ лет<br />технологической<br />экспертизы
            </h3>
            <div className="flex-grow"></div>
            <div className="mt-8 inline-flex items-center justify-center self-start px-8 py-3.5 bg-[#0077FF] text-white text-lg font-medium rounded-xl group-hover:bg-opacity-80 transition-all duration-300">
              Подробнее о нас
            </div>
          </div>
          {/* Картинка для десктопа */}
          <div className="hidden md:block absolute right-0 bottom-0 w-1/2 h-auto z-0">
            <Image src="/img/es15.png" alt="" width={300} height={300} className="w-full h-auto object-contain" />
          </div>
        </a>
        {/* Right Column */}
        <div className="flex flex-col gap-5 h-full">
          {/* Top Card */}
          <div
            className="group bg-white rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center gap-8 transition-all duration-300 outline outline-1 outline-transparent hover:outline-[#0077FF] flex-grow"
          >
            <div className="order-2 md:order-1 w-full md:w-auto">
              <h4 className="text-2xl font-normal text-black leading-snug mb-4 md:mb-0">
                «Единая Среда» — флагманский продукт российской компании для цифровизации городов.
              </h4>
            </div>
                            <div className="bg-[#F6F7F9] rounded-2xl flex items-center justify-center p-2.5 w-full md:w-1/2 h-full mx-auto">
              <Image src="/img/logo-mobile-black.svg" alt="Проверка подрядчиков" width={120} height={60} className="max-w-[50%] max-h-[50%] object-contain" />
            </div>
          </div>
          {/* Bottom 3 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {smallCards.map((card, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-3xl p-5 flex flex-col gap-4 transition-all duration-300 outline outline-1 outline-transparent hover:outline-[#0077FF]"
              >
                <div className="w-16 h-16 bg-[#F6F7F9] rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#0077FF]/10">
                  {card.icon}
                </div>
                <p className="text-base text-gray-400">
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