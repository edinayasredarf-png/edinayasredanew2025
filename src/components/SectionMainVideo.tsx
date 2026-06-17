'use client';

import React from 'react';
import { useModal } from './ModalProvider';

type SectionMainVideoProps = {
  className?: string;
  embedUrl?: string;
};

export default function SectionMainVideo({
  className = '',
  embedUrl = 'https://vkvideo.ru/video_ext.php?oid=-213906731&id=456239077&hash=0b614c9ba3d7bc0c&hd=4',
}: SectionMainVideoProps) {
  const { openRegister } = useModal();

  return (
    <section className={`bg-white w-full py-10 md:py-14 lg:py-16 font-raleway ${className}`}>
      <div className="rd-content-column">
        <div className="relative">
          <div className="mx-auto w-full rounded-2xl border-b-[10px] border-[#029cda] overflow-hidden">
            <div className="relative w-full bg-[#0b0b0b] h-[220px] sm:h-[320px] md:h-[480px] lg:h-[600px]">
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;"
                allowFullScreen
                loading="lazy"
                referrerPolicy="origin-when-cross-origin"
                title="Видео — Единая Среда"
                style={{ border: 0 }}
              />
            </div>
          </div>

          {/* Кнопка снизу по центру */}
          <div className="pt-6 md:pt-10 flex justify-center">
            <button
              type="button"
              onClick={openRegister}
              className="px-5 py-3.5 bg-[#029cda] hover:bg-[#0288bd] text-white rounded-lg text-xl font-medium leading-7 transition-colors"
            >
              Оставить заявку
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

