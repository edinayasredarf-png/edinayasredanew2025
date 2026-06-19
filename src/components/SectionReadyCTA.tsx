'use client';

import React from 'react';
import Image from 'next/image';
import { useModal } from './ModalProvider';

const SectionReadyCTA: React.FC = () => {
  const { openDemo, openConsult } = useModal();

  return (
    <section className="w-full py-10 md:py-14 lg:py-16">
      <div className="rd-content-column">
        <div className="relative w-full rounded-[32px] overflow-hidden min-h-[480px] lg:min-h-[580px]">

          {/* Фоновое изображение */}
          <Image
            src="/img/cta3.webp"
            alt=""
            fill
            className="object-cover object-center"
            sizes="(max-width: 1280px) 100vw, 1280px"
            priority
          />

          {/* Оверлей */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/70 to-white/30" />

          {/* Контент */}
          <div className="relative z-10 flex flex-col justify-between p-8 sm:p-12 lg:p-[78px] min-h-[480px] lg:min-h-[580px]">

            {/* Верхняя часть */}
            <div className="max-w-[620px] flex flex-col gap-5">
              <h2 className="font-involve text-[#313131] text-[clamp(1.8rem,3.8vw,2.9rem)] font-bold leading-[1.16]">
                Готовы перевести управление<br className="hidden sm:block" /> территорией в цифру?
              </h2>
              <p className="text-[#313131] text-lg md:text-xl font-[Raleway] leading-[1.5]">
                Покажем, как Единая Среда помогает вести учёт объектов, контролировать инфраструктуру и управлять подрядчиками в единой системе.
              </p>
            </div>

            {/* Нижняя часть */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mt-10 lg:mt-0">

              {/* Три действия */}
              <div className="flex flex-col items-start gap-5">
                <button
                  onClick={openDemo}
                  className="group flex items-center gap-3 text-left text-[#313131] font-involve font-bold text-xl md:text-2xl leading-8 hover:text-[#029cda] transition-colors"
                >
                  Запросить демонстрацию
                  <svg className="w-6 h-6 flex-shrink-0 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <button
                  onClick={openConsult}
                  className="group flex items-center gap-3 text-left text-[#313131] font-involve font-bold text-xl md:text-2xl leading-8 hover:text-[#029cda] transition-colors"
                >
                  Получить консультацию
                  <svg className="w-6 h-6 flex-shrink-0 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                <button
                  onClick={openConsult}
                  className="group flex items-center gap-3 text-left text-[#313131] font-involve font-bold text-xl md:text-2xl leading-8 hover:text-[#029cda] transition-colors"
                >
                  Назначить встречу
                  <svg className="w-6 h-6 flex-shrink-0 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Синяя кнопка CTA */}
              <button
                onClick={openDemo}
                className="group flex items-center justify-center gap-4 bg-[#029cda] text-white font-involve font-bold text-xl leading-8 px-8 py-6 rounded-3xl hover:bg-[#0288bd] transition-colors w-full lg:w-auto"
              >
                Демоверсия на 10 дней
                <svg className="w-6 h-6 flex-shrink-0 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionReadyCTA;
