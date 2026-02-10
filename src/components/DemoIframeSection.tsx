"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { StoriesModal } from "@/components/StoriesModal";

const storiesData = [
  {
    url: "/img/es_interface1.webp",
    header: { heading: "Инструкция 1", subheading: "", profileImage: "" },
  },
  {
    url: "/img/es_interface2.webp",
    header: { heading: "Инструкция 2", subheading: "", profileImage: "" },
  },
  {
    url: "/img/es_interface3.webp",
    header: { heading: "Инструкция 3", subheading: "", profileImage: "" },
  },
];

export default function DemoIframeSection() {
  const [isDemoLoaded, setIsDemoLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStoriesOpen, setIsStoriesOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    <div className="max-w-[1480px] mx-auto px-4 py-10">
			<div className="mb-6">
							<h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium">
								Демо-интерфейс системы
							</h2>
							<p className="text-gray-600 text-sm md:text-base mt-2 max-w-2xl">
								Нажмите кнопку Play, чтобы загрузить интерактивное демо.
							</p>
						</div>
      {/* Demo iframe */}
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

      {/* Instruction button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => setIsStoriesOpen(true)}
          className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#0077FF]/90 transition"
        >
          Посмотреть инструкцию
        </button>
      </div>

      {/* Stories Modal */}
      <StoriesModal
        stories={storiesData}
        isOpen={isStoriesOpen}
        onClose={() => setIsStoriesOpen(false)}
      />
    </div>
  );
}
