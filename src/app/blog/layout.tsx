import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { BlogHeader } from '@/components/redesign/BlogHeader';

export const metadata: Metadata = {
  title: 'Блог',
  description: 'Статьи, новости и кейсы о цифровизации территорий, опыте внедрений и продуктовых обновлениях платформы «Единая среда».',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: '/blog',
    title: 'Блог',
    description: 'Статьи, новости и кейсы о цифровизации территорий и платформа «Единая среда».',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f2f3f7] min-h-screen">
      <Suspense>
        <BlogHeader />
      </Suspense>
      {children}
    </div>
  );
}
