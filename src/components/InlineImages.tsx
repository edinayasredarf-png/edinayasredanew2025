'use client';
import React from 'react';
import Image from 'next/image';
import ZoomableImage from './ZoomableImage';

export type InlineImageItem = {
  src: string;
  alt?: string;
  /** Включить зум/лайтбокс для этой картинки */
  zoom?: boolean;
  /** Соотношение сторон контейнера превью (для сетки/вписывания) */
  aspectClass?: string; // напр. 'aspect-[4/3]' или 'aspect-video'
  /** Режим вписывания превью */
  fit?: 'cover' | 'contain';
  /** Доп. классы для обёртки конкретной картинки */
  className?: string;
};

type Props = {
  items: InlineImageItem[];
  /** Классы обёртки сетки */
  className?: string;
  /** Кол-во колонок на разных брейкпойнтах (по умолчанию 1/2/3) */
  cols?: { base?: number; md?: number; lg?: number };
  /** gap между карточками (по умолчанию gap-4) */
  gapClass?: string;
};

const InlineImages: React.FC<Props> = ({
  items,
  className = '',
  cols = { base: 1, md: 2, lg: 3 },
  gapClass = 'gap-4',
}) => {
  const baseCols = cols.base ?? 1;
  const mdCols = cols.md ?? Math.max(baseCols, 2);
  const lgCols = cols.lg ?? Math.max(mdCols, 3);

  const gridColsClass = [
    `grid grid-cols-${baseCols}`,
    mdCols ? `md:grid-cols-${mdCols}` : '',
    lgCols ? `lg:grid-cols-${lgCols}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${gridColsClass} ${gapClass} ${className}`}>
      {items.map((item, i) => {
        const aspect = item.aspectClass || 'aspect-[4/3]';
        const fit = item.fit || 'cover';

        if (item.zoom) {
          // зум-версия — идёт через ZoomableImage (сам регистрируется в галерее)
          return (
            <ZoomableImage
              key={`${item.src}-${i}`}
              src={item.src}
              alt={item.alt || ''}
              aspectClass={aspect}
              fit={fit}
              className={item.className || ''}
            />
          );
        }

        // обычная картинка без зума
        return (
          <div
            key={`${item.src}-${i}`}
            className={`relative ${aspect} rounded-xl overflow-hidden bg-[#F6F7F9] ${item.className || ''}`}
          >
            <Image
              src={item.src}
              alt={item.alt || ''}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={`object-${fit}`}
              priority={false}
            />
          </div>
        );
      })}
    </div>
  );
};

export default InlineImages;
