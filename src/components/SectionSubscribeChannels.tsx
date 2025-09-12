"use client";
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const channels = [
  {
    title: 'Telegram-канал ЕС',
    description: 'Кейсы, обновления платформы и новости из мира геоданных и цифровизации .',
    icon: '/icons/tg.svg',
    buttonText: 'Подписаться',
    buttonHref: 'https://t.me/edinayasredarf',
  },
  {
    title: 'Telegram-канал Статов Live',
    description: 'Авторские мысли и опыт основателя сервиса.',
    icon: '/icons/tg.svg',
    buttonText: 'Подписаться',
    buttonHref: 'https://t.me/statovlive',
  },
  {
    title: 'Сообщество ВКонтакте',
    description: 'Присоединяйтесь, чтобы обсуждать кейсы, делиться опытом и задавать вопросы.',
    icon: '/icons/vk.svg',
    buttonText: 'Подписаться',
    buttonHref: 'https://vk.com/edinayasredarf',
  },
  {
    title: 'Наш блог на Dzen',
    description: 'Глубокие технические разборы, лучшие практики и аналитика в области геоданных.',
    icon: '/icons/dzen.svg',
    buttonText: 'Читать',
    buttonHref: 'https://dzen.ru/edinayasreda',
  },
  {
    title: 'Канал на YouTube',
    description: 'Вебинары, обучающие видео и демонстрации возможностей платформы',
    icon: '/icons/youtube.svg',
    buttonText: 'Смотреть',
    buttonHref: '#',
  },
];

const SectionSubscribeChannels = () => {
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<any>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [navReady, setNavReady] = useState(false);

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
    <section className="py-10 lg:py-20">
      <div className="max-w-[1480px] mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-center text-black text-2xl md:text-4xl lg:text-[50px] font-medium leading-[1.1] mb-0">
            Подпишитесь на каналы
          </h2>
        </div>
        {/* Slider Wrapper */}
        <div className="relative">
          <Swiper
            key={navReady ? 'ready' : 'not-ready'}
            modules={[Navigation, Pagination]}
            slidesPerView={1}
            spaceBetween={24}
            onSwiper={setSwiperInstance}
            navigation={navReady ? {
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            } : undefined}
            pagination={navReady ? { clickable: true, el: paginationRef.current } : undefined}
            breakpoints={{
              640: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="channels-swiper"
          >
            {channels.map((ch, idx) => (
              <SwiperSlide key={idx}>
                <div className="bg-white rounded-3xl p-8 h-full flex flex-col min-h-[260px]">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-2xl font-bold text-black">
                      {ch.title}
                    </h3>
                    <Image src={ch.icon} alt={ch.title} width={48} height={48} className="w-12 h-12" />
                  </div>
                  <p className="text-lg text-gray-500 flex-grow mb-8">
                    {ch.description}
                  </p>
                  <a
                    href={ch.buttonHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-auto self-start inline-flex items-center gap-2 text-[#0077FF] font-medium"
                  >
                    <span>{ch.buttonText}</span>
                    <svg
                      className="w-6 h-6 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </a>
                </div>
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
      </div>
    </section>
  );
};

export default SectionSubscribeChannels;