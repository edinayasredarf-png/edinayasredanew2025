"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const ProductsTeamsSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [progressMs, setProgressMs] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const [isVideoFading, setIsVideoFading] = useState(false);

  const slides = [
    {
      name: "Единая Среда",
      tabIcon: "/icons/es-blue.svg",
      icon: (
        <Image
          src="/icons/es-blue.svg"
          alt="Единая Среда"
          width={500}
          height={300}
          className="w-full max-w-[500px] object-contain"
          style={{ height: "auto" }}
        />
      ),
      video: "https://media.единаясреда.рф/media/es.mp4",
      title: "Единая Среда",
      description:
        "Цифровая платформа для управления муниципальной собственностью ",
      statsLabel: "Сервис номер 1 для оцифровки городов",
      secondaryDesc: "В системе уже более 40 регионов РФ",
      url: "https://edinayasreda.ru/",
    },
    {
      name: "MyRoots",
      tabIcon: "/icons/myroots.svg",
      icon: (
        <Image
          src="/icons/myroots.svg"
          alt="Мои Корни"
          width={50}
          height={50}
          className="w-full max-w-[50px] object-contain"
          style={{ height: "auto" }}
        />
      ),
      video: "https://media.единаясреда.рф/media/myroots.mp4",
      title: "MyRoots",
      description:
        "Сервис для построения генеалогического древа и ухода за местами захоронений",
      stats: "10,000+",
      statsLabel: "Пользователей",
      secondaryDesc: "Сохранение семейной истории для будущих поколений",
      url: "https://myroots.pro/",
    },
    {
      name: "Область Развития",
      tabIcon: "/icons/oblastrazvitia.svg",
      icon: (
        <Image
          src="/icons/oblastrazvitia.svg"
          alt="Область Развития"
          width={50}
          height={50}
          className="w-full max-w-[50px] object-contain"
          style={{ height: "auto" }}
        />
      ),
      video: "https://media.единаясреда.рф/media/oblastrazvitiya.mov",
      title: "Область Развития",
      description:
        "Платформа для развития территорий и привлечения инвестиций в проекты благоустройства",
      stats: "50+",
      statsLabel: "Реализованных проектов",
      secondaryDesc: "Создание комфортной городской среды для жителей",
      url: "https://oblastrazvitia.ru/",
    },
  ];

  const DURATION_MS = 15000;

  const getVideoType = (src: string): string => {
    if (src.endsWith(".mp4")) return "video/mp4";
    if (src.endsWith(".mov")) return "video/quicktime";
    return "video/mp4";
  };

  // Инициализация первой дорожки
  useEffect(() => {
    setVideoSrc(slides[0].video);
  }, []);

  // Плавная смена видео при смене activeSlide
  useEffect(() => {
    const newSrc = slides[activeSlide].video;

    setIsVideoFading(true);
    const timeout = setTimeout(() => {
      setVideoSrc(newSrc);
      setProgressMs(0);
      setIsVideoFading(false);
    }, 200); // лёгкий фейд-аут перед сменой

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlide]);

  // Автопрогресс и автосмена слайдов
  useEffect(() => {
    let lastTime: number | null = null;
    let progress = 0;

    const frame = (now: number) => {
      if (lastTime === null) lastTime = now;
      const delta = now - lastTime;
      lastTime = now;

      if (isPlaying) {
        progress = Math.min(DURATION_MS, progress + delta);
        setProgressMs(progress);

        if (progress >= DURATION_MS) {
          setActiveSlide((prev) =>
            prev === slides.length - 1 ? 0 : prev + 1
          );
          return;
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    setProgressMs(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeSlide, isPlaying, slides.length]);

  // Автоплей при смене src
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isPlaying) {
      void videoEl.play().catch(() => setIsPlaying(false));
    } else {
      videoEl.pause();
    }
  }, [videoSrc, isPlaying]);

  return (
    <section className="w-full max-w-[1440px] mx-auto flex flex-col items-start gap-10 md:gap-16 py-12 md:py-20 font-[Raleway] font-medium">
      <div className="w-full h-[520px] md:h-[640px] xl:h-[760px] relative rounded-[28px] md:rounded-[40px] overflow-hidden">
        {/* Фоновое видео */}
        <div className="absolute inset-0 w-full h-full bg-black">
          <video
            key={videoSrc} // принудительный ремоунт при смене src
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            ref={videoRef}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isVideoFading ? "opacity-0" : "opacity-70"
            } pointer-events-none`}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={() => {
              if (isPlaying) {
                void videoRef.current?.play().catch(() => setIsPlaying(false));
              }
            }}
          >
            <source src={videoSrc} type={getVideoType(videoSrc)} />
            Ваш браузер не поддерживает видео тег.
          </video>
        </div>

        {/* Контент поверх видео */}
        <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-6 md:p-10">
          {/* Навигационные табы */}
          <div className="flex flex-wrap gap-2">
            {slides.map((slide, index) => {
              const isActive = activeSlide === index;
              const progressPercent = isActive
                ? Math.min(100, Math.round((progressMs / DURATION_MS) * 100))
                : 0;

              return (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className="relative rounded-[10px] overflow-hidden bg-white/90 border border-gray-200 px-3 py-2 md:px-4 md:py-2.5 backdrop-blur-sm"
                >
                  {/* Заливка прогресса */}
                  <div className="absolute inset-0">
                    <div
                      className="h-full bg-[#D6D7DB] transition-[width] duration-200 ease-linear"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Контент таба */}
                  <div className="relative z-10 flex items-center gap-2">
                    <Image
                      src={slide.tabIcon}
                      alt={slide.name}
                      width={20}
                      height={20}
                    />
                    {isActive && (
                      <span className="text-xs md:text-sm text-[#313131]">
                        {slide.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Карточки поверх видео */}
          <div className="w-full flex flex-col md:flex-row gap-3 md:gap-4 items-stretch md:items-end md:justify-between mt-4 md:mt-0">
            {/* Основная карточка */}
            <div className="w-full md:w-[420px] bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 mx-auto md:mx-0 text-center md:text-left">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg flex items-center justify-center">
                    {slides[activeSlide].icon}
                  </div>
                  <h3 className="text-[20px] md:text-[28px] font-normal font-helvetica leading-tight text-gray-800">
                    {slides[activeSlide].title}
                  </h3>
                </div>
                <p className="text-xs md:text-sm lg:text-base text-gray-700">
                  {slides[activeSlide].description}
                </p>
                <div className="flex flex-col md:flex-row justify-between items-end gap-3">
                  <div className="pr-0 md:pr-6">
                    <p className="text-xs md:text-sm lg:text-base text-gray-700">
                      {slides[activeSlide].secondaryDesc}
                    </p>
                  </div>
                  <Link
                    href={slides[activeSlide].url}
                    className="bg-[#029cda] rounded-full shrink-0 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center hover:opacity-90 transition"
                    aria-label={`Перейти на сайт: ${slides[activeSlide].name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path d="M5 12H19" stroke="white" strokeWidth="2" />
                      <path
                        d="M12 5L19 12L12 19"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Статистика (только на md+) */}
            <div className="hidden md:block bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 w-full md:w-[260px]">
              <div className="flex flex-col">
                {slides[activeSlide].stats && (
                  <div className="text-[26px] md:text-[32px] font-normal font-helvetica leading-tight text-gray-800">
                    {slides[activeSlide].stats}
                  </div>
                )}
                <div className="mt-1 text-sm md:text-base text-gray-700">
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
