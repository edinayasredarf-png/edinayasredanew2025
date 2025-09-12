'use client';
import React from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  src: string;          // путь к svg (/icons/Tree.svg)
  alt?: string;
  size?: number;        // px
  className?: string;
  light?: string;       // цвет в «светлой» шапке
  dark?: string;        // цвет в «тёмной» шапке
};

const ThemedIcon: React.FC<Props> = ({
  src,
  alt = '',
  size = 24,
  className = '',
  light = '#212121',
  dark = '#FFFFFF',
}) => {
  const pathname = usePathname();
  // где нужен белый header — у вас это /cases и вложенные
  const isLight = pathname?.startsWith('/cases');

  const color = isLight ? light : dark;

  return (
    <span
      role="img"
      aria-label={alt}
      className={`inline-block ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
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
