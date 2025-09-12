import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Инвентаризация зелёных насаждений — Единая среда',
  description: 'Инвентаризация деревьев и зелёных насаждений: ГИС-учёт, аналитика, паспорта объектов. Точные данные и отчёты.',
  alternates: { canonical: '/services/green-inventory' },
  openGraph: {
    title: 'Инвентаризация зелёных насаждений — Единая среда',
    description: 'Полный учёт зелёных зон: координаты, атрибуты, аналитика в ГИС.',
    url: '/services/green-inventory',
    type: 'article',
    images: [{ url: '/img/услуга_изн.png', width: 1200, height: 630, alt: 'Инвентаризация зелёных насаждений' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Инвентаризация зелёных насаждений — Единая среда',
    description: 'Профессиональная инвентаризация зелёных зон: точность и аналитика.',
    images: ['/img/услуга_изн.png'],
  },
};

export default function ServicesGreenInventoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}


