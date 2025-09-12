import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Блог — Единая среда',
  description: 'Статьи, новости и кейсы о цифровизации территорий, опыте внедрений и продуктовых обновлениях платформы «Единая среда».',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: '/blog',
    title: 'Блог — Единая среда',
    description: 'Статьи, новости и кейсы о цифровизации территорий и платформа «Единая среда».',
  },
};

/**
 * Отдельный лэйаут для блока /blog — без общего Header сайта.
 * Общий фон и отступы как в референсе.
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f2f3f7] min-h-screen">
      {children}
    </div>
  );
}
