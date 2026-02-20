"use client";

import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import Image from "next/image";
import { StoriesModal } from "@/components/StoriesModal";
import type { Story } from "@/lib/storiesStore";

const storiesData = [
  {
    url: "/img/demo/1.webp",
    header: { heading: "Инструкция 1", subheading: "", profileImage: "" },
  },
  {
    url: "/img/demo/2.webp",
    header: { heading: "Инструкция 2", subheading: "", profileImage: "" },
  },
  {
    url: "/img/demo/3.webp",
    header: { heading: "Инструкция 3", subheading: "", profileImage: "" },
  },
  {
    url: "/img/demo/4.webp",
    header: { heading: "Инструкция 4", subheading: "", profileImage: "" },
  },
  {
    url: "/img/demo/5.webp",
    header: { heading: "Инструкция 5", subheading: "", profileImage: "" },
  },
  {
    url: "/img/demo/6.webp",
    header: { heading: "Инструкция 6", subheading: "", profileImage: "" },
  },
];

export default function DemoPage() {
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Создаём объект Story из локальных демо-сторис
  const demoStory: Story = {
    id: "demo",
    title: "Инструкция",
    thumbnail: storiesData[0].url,
    slides: storiesData.map((s, i) => ({
      id: `demo-${i}`,
      type: "image",
      url: s.url,
      text: s.header.heading,
      textPosition: "bottom",
      duration: 5000,
    })),
    createdAt: 0,
    updatedAt: 0,
    viewCount: 0,
  };

  const handleKP = () => window.dispatchEvent(new CustomEvent("openKPModal"));
  const handleConsult = () =>
    window.dispatchEvent(new CustomEvent("openConsultModal"));

  // Fullscreen
  const handleFullscreen = () => {
    if (iframeRef.current) {
      iframeRef.current.requestFullscreen?.();
    }
  };

  const exitFullscreen = () => document.exitFullscreen?.();

  useEffect(() => {
    const listener = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);

  return (
    <Layout>
      <div className="font-[Raleway] font-medium lining-nums">
        {/* Hero */}
        <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden">
          <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-4 py-10 md:py-16">
            <div className="max-w-4xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium leading-tight">
                Демо-версия <br />АИС «Единая среда»
              </h1>
              <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl">
                Посмотрите, как работает система: интерактивная карта, карточки
                объектов, реестры, поиск, отчеты и аналитика.
              </p>
              <div className="mt-10">
                <button
                  onClick={() => setIsStoriesOpen(true)}
                  className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#0077FF]/90 transition"
                >
                  Посмотреть инструкцию
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Demo iframe */}
        <section className="py-6 md:py-10">
          <div className="max-w-[1480px] mx-auto px-4">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium">
                Демо-интерфейс системы
              </h2>
              <p className="text-gray-600 text-sm md:text-base mt-2 max-w-2xl">
                Нажмите кнопку Play, чтобы загрузить интерактивное демо.
              </p>
            </div>

            <div className="relative w-full mt-4 pt-10">
              <div className="relative w-full rounded-[20px] overflow-hidden shadow-[0_0_0_1px_rgba(15,23,42,0.06)] min-h-[560px]">
                {/* COVER */}
                {!isDemoLoaded && (
                  <>
                    <Image
                      src="/img/demo-cover-desktop.jpg"
                      alt="Превью демо системы"
                      fill
                      priority
                      className="hidden md:block object-cover"
                    />
                    <Image
                      src="/img/demo-cover-mobile.jpg"
                      alt="Превью демо системы"
                      fill
                      priority
                      className="md:hidden object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 z-10" />
                    {/* Play button */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center">
                      <button
                        onClick={() => setIsDemoLoaded(true)}
                        className="relative flex items-center justify-center w-32 h-32 group"
                      >
                        <span className="absolute w-32 h-32 rounded-full bg-[#3D98FF]/20 transition-transform duration-500 group-hover:scale-110"></span>
                        <span className="absolute w-24 h-24 rounded-full bg-[#3D98FF]/30 transition-transform duration-500 group-hover:scale-125"></span>
                        <span className="absolute w-16 h-16 rounded-full bg-[#0077FF]"></span>
                        <Image
                          src="/img/play.svg"
                          alt="Play demo"
                          width={38}
                          height={38}
                          className="relative z-10 group-hover:scale-110 transition"
                        />
                      </button>
                    </div>
                  </>
                )}

                {/* iframe */}
                {isDemoLoaded && (
                  <div className="relative animate-[fadeIn_0.35s_ease]">
                    <iframe
                      ref={iframeRef}
                      src="https://edinayasreda.ru/widget-api/widgetInfo/3de475668fe4652b8a699f4e317f99fe1f3e90783488d3d18926574b526c32b3"
                      title="Демо-версия АИС «Единая среда»"
                      className="w-full h-[70vh] min-h-[560px] border-0"
                      loading="lazy"
                      allow="clipboard-read; clipboard-write; fullscreen"
                    />

                    {/* Fullscreen button */}
                    <button
                      onClick={handleFullscreen}
                      className="absolute bottom-4 right-4 bg-white/90 text-[#0077FF] px-4 py-2 rounded-xl font-medium hover:bg-white transition shadow-lg z-30"
                    >
                      Открыть на полный экран
                    </button>

                    {/* Exit fullscreen */}
                    {isFullscreen && (
                      <button
                        onClick={exitFullscreen}
                        className="absolute bottom-4 left-4 bg-white/90 text-[#0077FF] px-4 py-2 rounded-xl font-medium hover:bg-white transition shadow-lg z-30"
                      >
                        Вернуться на страницу
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stories Modal */}
        {isStoriesOpen && (
          <StoriesModal
            allStories={[demoStory]}
            startIndex={0}
            isOpen
            onClose={() => setIsStoriesOpen(false)}
          />
        )}

        {/* CTA */}
        <section className="py-14 md:py-20">
          <div className="max-w-[900px] mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-4">
              Хотите посмотреть на систему с менеджером?
            </h2>
            <p className="text-gray-700 text-sm md:text-base mb-6">
              Покажем нужные модули и сценарии, ответим на вопросы и подскажем
              оптимальный формат внедрения.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleConsult}
                className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#0077FF]/90 transition"
              >
                Запросить видеосозвон
              </button>
              <button
                onClick={handleKP}
                className="bg-white text-[#0077FF] border border-[#0077FF] px-8 py-4 rounded-xl font-medium hover:bg-[#0077FF]/10 transition"
              >
                Получить коммерческое предложение
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}