'use client';
import React from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  /** Путь к svg (например, /icons/Tree.svg) */
  src: string;
  alt?: string;
  /** Размер иконки в пикселях */
  size?: number;
  className?: string;
  /** Цвет иконки в «светлой» шапке (роуты /cases/...) */
  light?: string;
  /** Цвет иконки в «тёмной» шапке (остальные роуты) */
  dark?: string;
  /**
   * Принудительный цвет. Если указан — перекрывает light/dark.
   * Можно передать '#000' или 'currentColor'.
   */
  color?: string;
};

const ThemedIcon: React.FC<Props> = ({
  src,
  alt = '',
  size = 24,
  className = '',
  light = '#212121',
  dark = '#FFFFFF',
  color,
}) => {
  const pathname = usePathname();
  const isLight = pathname?.startsWith('/cases');

  const finalColor = color ?? (isLight ? light : dark);

  return (
    <span
      role="img"
      aria-label={alt}
      className={`inline-block ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: finalColor,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        display: 'inline-block',
      }}
    />
  );
};

export default ThemedIcon;
