"use client";
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const ProductsTeamsSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [progressMs, setProgressMs] = useState<number>(0);
  const rafRef = useRef<number | null>(null);

  const getVideoType = (src: string): string => {
    if (src.endsWith('.mp4')) return 'video/mp4';
    if (src.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
  };

  const slides = [
    {
      name: "Единая Среда",
      tabIcon: "/icons/es-blue.svg",
      iconColor: "bg-[#0077FF]",
      icon: (
				<img
				src="/icons/es-blue.svg"
				alt="Единая Среда"
				className="w-full max-w-[500px] object-contain"
				style={{ height: 'auto' }}
			/>
      ),
      video: "https://media.единаясреда.рф/media/es.mp4",
      title: "Единая Среда",
      description: "Цифровая платформа для управления муниципальной собственностью ",
      statsLabel: "Сервис номер 1 для оцифровки городов",
      secondaryDesc: "В системе уже более 40 регионов РФ",
      url: "https://edinayasreda.ru/"
    },
    {
      name: "MyRoots",
      tabIcon: "/icons/myroots.svg",
      iconColor: "bg-[#0077FF]",
      icon: (
				<img
				src="/icons/myroots.svg"
				alt="Мои Корни"
				className="w-full max-w-[50px] object-contain"
				style={{ height: 'auto' }}
			/>
      ),
      video: "https://media.единаясреда.рф/media/myroots.mp4",
      title: "MyRoots",
      description: "Сервис для построения генеалогического древа и ухода за местами захоронений",
      stats: "10,000+",
      statsLabel: "Пользователей",
      secondaryDesc: "Сохранение семейной истории для будущих поколений",
      url: "https://myroots.pro/"
    },
    {
      name: "Область Развития",
      iconColor: "bg-yellow-500",
      tabIcon: "/icons/oblastrazvitia.svg",
      icon: (
     			<img
				src="/icons/oblastrazvitia.svg"
				alt="Область Развития"
				className="w-full max-w-[50px] object-contain"
				style={{ height: 'auto' }}
			/>
      ),
      video: "https://media.единаясреда.рф/media/oblastrazvitiya.mov",
      title: "Область Развития",
      description: "Платформа для развития территорий и привлечения инвестиций в проекты благоустройства",
      stats: "50+",
      statsLabel: "Реализованных проектов",
      secondaryDesc: "Создание комфортной городской среды для жителей",
      url: "https://oblastrazvitia.ru/"
    }
  ];

  // Автоматическая смена слайдов каждые 15 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 15000);

    return () => clearInterval(interval);
  }, [slides.length]);

  // Обновляем источник видео при смене слайда
  useEffect(() => {
    setVideoSrc(slides[activeSlide].video);
    setProgressMs(0);
  }, [activeSlide]);

  // При смене источника/слайда пытаемся воспроизвести видео, если режим воспроизведения активен
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      // Неблокирующий вызов play()
      void videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Браузер мог заблокировать автоплей
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
    }
  }, [videoSrc, activeSlide, isPlaying]);

  // Прогресс заливки активного таба (5 секунд на слайд). Останавливается при паузе видео
  useEffect(() => {
    const DURATION_MS = 15000;
    const tick = (startTs: number) => {
      rafRef.current = requestAnimationFrame((now) => {
        if (!isPlaying) {
          // Если видео на паузе, замораживаем кадр, но продолжаем запросы, чтобы быстро возобновить
          tick(startTs + (now - startTs));
          return;
        }
        const elapsed = Math.min(DURATION_MS, now - startTs);
        setProgressMs(elapsed);
        if (elapsed >= DURATION_MS) {
          // Переходим к следующему слайду
          setActiveSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
          return;
        }
        tick(startTs);
      });
    };

    // Старт/рестарт цикла при смене слайда или статусе воспроизведения
    cancelAnimationFrame(rafRef.current ?? 0);
    setProgressMs(0);
    rafRef.current = requestAnimationFrame((now) => tick(now));
    return () => cancelAnimationFrame(rafRef.current ?? 0);
  }, [activeSlide, isPlaying, slides.length]);

  const handleTogglePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (isPlaying) {
      videoEl.pause();
      setIsPlaying(false);
    } else {
      void videoEl.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto flex flex-col items-start gap-16 py-20">


      {/* Слайдер */}
      <div className="w-full h-[760px] relative rounded-[40px] overflow-hidden">
        {/* Фоновое видео */}
        <div className="absolute inset-0 w-full h-full bg-black">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover opacity-70"
            key={videoSrc}
            ref={videoRef}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={() => { if (isPlaying) { void videoRef.current?.play(); } }}
          >
            <source src={videoSrc} type={getVideoType(videoSrc)} />
            Ваш браузер не поддерживает видео тег.
          </video>
        </div>

        {/* Контент поверх видео */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6 md:p-12">
          {/* Навигационные кнопки */}
          <div className="flex flex-wrap gap-1">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className="relative rounded-[10px] overflow-hidden bg-white border border-gray-200 px-3 py-2"
              >
                {/* Прогресс-заливка для активного таба */}
                <div className="absolute inset-0">
                  <div
                    className="h-full bg-gray-300"
                    style={{ width: activeSlide === index ? `${Math.round((progressMs / 15000) * 100)}%` : '0%' }}
                  />
                </div>

                {/* Контент таба */}
                <div className="relative z-10 flex items-center gap-2">
                  {/* Иконка проекта */}
                  <Image src={slide.tabIcon} alt="" width={20} height={20} />
                  {/* Текст только для активного таба */}
                  {activeSlide === index && (
                    <span className="text-sm text-gray-900">{slide.name}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Карточка с информацией */}
          <div className="w-full max-w-[320px] md:max-w-none md:w-[440px] flex flex-col gap-2 mx-auto md:mx-0 items-center md:items-stretch text-center md:text-left">
            {/* Основная карточка */}
            <div className="bg-white  rounded-3xl p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className={`w-12 h-12 md:w-16 md:h-16 ${slides[activeSlide].iconColor} rounded-lg flex items-center justify-center`}>
                    {slides[activeSlide].icon}
                  </div>
                  <h3 className="text-[22px] md:text-[32px] font-normal font-helvetica leading-tight md:leading-loose text-gray-800">
                    {slides[activeSlide].title}
                  </h3>
                </div>
                <p className="text-sm md:text-base text-gray-700">
                  {slides[activeSlide].description}
                </p>
                <div className="flex justify-between items-end w-full">
                  <div className="pr-0 md:pr-8">
                    <p className="text-sm md:text-base text-gray-700">
                      {slides[activeSlide].secondaryDesc}
                    </p>
                  </div>
                  <Link
                    href={slides[activeSlide].url}
                    className={`${slides[activeSlide].iconColor || 'bg-[#0077FF]'} rounded-full shrink-0 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center hover:opacity-90 transition`}
                    aria-label={`Перейти на сайт: ${slides[activeSlide].name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19" stroke="white" strokeWidth="2"/>
                      <path d="M12 5L19 12L12 19" stroke="white" strokeWidth="2"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Статистическая карточка — скрываем на мобильных */}
            <div className="hidden md:block bg-white rounded-3xl p-4">
              <div className="flex flex-col">
                <div className="text-[32px] font-normal font-helvetica leading-loose text-gray-800">
                  {slides[activeSlide].stats}
                </div>
                <div className="text-base text-gray-700">
                  {slides[activeSlide].statsLabel}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsTeamsSection;