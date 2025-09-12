'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useGallery } from './GalleryProvider';

type Props = {
  src: string;
  alt?: string;
  className?: string;
  /** По умолчанию true — рисуем иконку лупы в правом верхнем углу */
  showZoomIcon?: boolean;
  /** Относительный путь к SVG-иконке из /public */
  zoomIconSrc?: string; // default: /icons/zoom.svg
  /** Если true — превью не зумится (иконка и ховер скрыты) */
  disableZoom?: boolean;
  /** objectFit превью */
  fit?: 'cover' | 'contain';
  /** Соотношение сторон (для контейнера превью), например 'aspect-[4/3]' */
  aspectClass?: string;
};

const ZoomableImage: React.FC<Props> = ({
  src,
  alt = '',
  className = '',
  showZoomIcon = true,
  zoomIconSrc = '/icons/zoom.svg',
  disableZoom = false,
  fit = 'cover',
  aspectClass = 'aspect-[4/3]',
}) => {
  const { register, open } = useGallery();
  const [idx, setIdx] = useState<number | null>(null);

  // регистрируем изображение в галерее (один раз)
  useEffect(() => {
    if (disableZoom) return;
    const i = register({ src, alt });
    setIdx(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, src, disableZoom]); // alt можно опустить

  const canZoom = useMemo(() => !disableZoom && typeof idx === 'number', [disableZoom, idx]);

  return (
    <div className={`relative ${aspectClass} rounded-xl overflow-hidden bg-[#F6F7F9] group ${className}`}>
      {/* превью */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className={`object-${fit}`}
        priority={false}
      />

      {/* затемняющий ховер слой — только если можно зумить */}
      {canZoom && (
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/0 group-hover:bg-black/10" />
      )}

      {/* кнопка-лупа (SVG из /public/icons/zoom.svg) */}
      {canZoom && showZoomIcon && (
        <button
          type="button"
          aria-label="Увеличить"
          onClick={() => idx != null && open(idx)}
          className="absolute top-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#111]/80 hover:bg-[#111]/90 transition
                     shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Image src={zoomIconSrc} alt="" width={18} height={18} />
        </button>
      )}

      {/* если иконку не показываем, даём клик по всей карточке */}
      {canZoom && !showZoomIcon && (
        <button
          type="button"
          aria-label="Открыть изображение"
          onClick={() => idx != null && open(idx)}
          className="absolute inset-0 z-10"
        />
      )}
    </div>
  );
};

export default ZoomableImage;
