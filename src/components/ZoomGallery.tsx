'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export type GalleryItem = { src: string; alt?: string };

type GalleryCtx = {
  isOpen: boolean;
  items: GalleryItem[];
  index: number;
  open: (items: GalleryItem[], index?: number) => void;
  close: () => void;
};

const Ctx = createContext<GalleryCtx | null>(null);
export const useGallery = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useGallery must be used within <ZoomGallery>');
  return ctx;
};

const ZoomGallery: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setOpen] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [index, setIndex] = useState(0);

  // Swiper навигация
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [swiper, setSwiper] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    setNavReady(!!prevRef.current && !!nextRef.current && !!paginationRef.current);
  }, [prevRef.current, nextRef.current, paginationRef.current]);

  useEffect(() => {
    if (!swiper) return;
    const update = () => {
      setIsBeginning(swiper.isBeginning);
      setIsEnd(swiper.isEnd);
      setIndex(swiper.activeIndex);
    };
    swiper.on('slideChange', update);
    update();
    return () => {
      swiper.off('slideChange', update);
    };
  }, [swiper]);

  const open = useCallback((its: GalleryItem[], i: number = 0) => {
    setItems(its);
    setIndex(Math.max(0, Math.min(i, its.length - 1)));
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  // Esc + блок скролла фона
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, close]);

  return (
    <Ctx.Provider value={{ isOpen, items, index, open, close }}>
      <style jsx global>{`
        .zoom {
          cursor: zoom-in;
        }
      `}</style>

      {children}

      {isOpen && (
        <div className="fixed inset-0 z-[2147483647]">
          {/* тёмный фон */}
          <div className="absolute inset-0 bg-black/80" onClick={close} />

          {/* контент поверх фона */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div className="relative w-full max-w-6xl pointer-events-auto">
              {/* КРЕСТИК: вровень с верхом изображения, с отступом справа */}
              <button
                aria-label="Закрыть"
                onClick={close}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-50 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/90 hover:bg-white shadow-lg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <Swiper
                key={navReady ? 'ready' : 'not-ready'}
                modules={[Navigation, Pagination, Keyboard]}
                slidesPerView={1}
                initialSlide={index}
                onSwiper={setSwiper}
                navigation={
                  navReady
                    ? { prevEl: prevRef.current!, nextEl: nextRef.current! }
                    : undefined
                }
                pagination={
                  navReady
                    ? { clickable: true, el: paginationRef.current! }
                    : undefined
                }
                keyboard={{ enabled: true }}
                className="rounded-2xl overflow-hidden bg-black"
              >
                {items.map((it, idx) => (
                  <SwiperSlide key={idx}>
                    <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[75vh]">
                      <Image
                        src={it.src}
                        alt={it.alt || ''}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority={idx === index}
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* пагинация — только мобилки */}
              <div
                ref={paginationRef}
                className="swiper-pagination !bottom-4 !relative z-10 block md:!hidden mt-4 !flex !gap-2 !justify-center"
              />

              {/* стрелки как в вашем референсе (снизу по центру, md+) */}
              <div className="hidden md:flex justify-center pt-4 pb-2 z-10">
                <button
                  ref={prevRef}
                  aria-label="Предыдущий слайд"
                  className={`w-[50px] h-[60px] bg-[#0077FF] rounded-tl-[50px] rounded-bl-[50px] flex justify-center items-center transition duration-200 hover:bg-opacity-90 ${
                    isBeginning ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isBeginning}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path d="M15 6l-6 6 6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  ref={nextRef}
                  aria-label="Следующий слайд"
                  className={`w-[50px] h-[60px] bg-[#0077FF] rounded-tr-[50px] rounded-br-[50px] flex justify-center items-center transition duration-200 hover:bg-opacity-90 ${
                    isEnd ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={isEnd}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path d="M9 6l6 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
};

export default ZoomGallery;
