import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Лесоустройство — Единая среда',
  description: 'Комплекс работ по лесоустройству: таксация, проектирование, карты и документация. Работа по требованиям законодательства.',
  alternates: { canonical: '/services/les' },
  openGraph: {
    title: 'Лесоустройство — Единая среда',
    description: 'Таксация, документация и карты — полный комплекс лесоустройства.',
    url: '/services/les',
    type: 'article',
    images: [{ url: '/img/лес.png', width: 1200, height: 630, alt: 'Лесоустройство' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Лесоустройство — Единая среда',
    description: 'Профессиональные работы по лесоустройству.',
    images: ['/img/лес.png'],
  },
};

export default function ServicesForestManagementLayout({ children }: { children: React.ReactNode }) {
  return children;
}


