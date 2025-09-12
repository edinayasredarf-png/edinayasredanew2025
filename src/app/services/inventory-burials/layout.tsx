import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Инвентаризация мест захоронений — Единая среда',
  description: 'Профессиональная инвентаризация мест захоронений: сбор, оцифровка и аналитика данных. Соответствие требованиям и высокая точность.',
  alternates: { canonical: '/services/inventory-burials' },
  openGraph: {
    title: 'Инвентаризация мест захоронений — Единая среда',
    description: 'Сбор, оцифровка и аналитика данных о местах захоронений. Точность и соответствие требованиям.',
    url: '/services/inventory-burials',
    type: 'article',
    images: [{ url: '/img/cemetery.png', width: 1200, height: 630, alt: 'Инвентаризация мест захоронений' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Инвентаризация мест захоронений — Единая среда',
    description: 'Профессиональная инвентаризация кладбищ: точные данные и аналитика.',
    images: ['/img/cemetery.png'],
  },
};

export default function ServicesInventoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}


