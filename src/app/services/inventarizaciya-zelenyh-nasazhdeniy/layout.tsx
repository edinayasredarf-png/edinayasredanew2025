import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Инвентаризация зелёных насаждений — Единая среда',
  description: 'Инвентаризация деревьев и зелёных насаждений: ГИС-учёт, аналитика, паспорта объектов. Точные данные и отчёты.',
  alternates: { canonical: '/services/inventarizaciya-zelenyh-nasazhdeniy' },
  openGraph: {
    title: 'Инвентаризация зелёных насаждений — Единая среда',
    description: 'Полный учёт зелёных зон: координаты, атрибуты, аналитика в ГИС.',
    url: '/services/inventarizaciya-zelenyh-nasazhdeniy',
    type: 'article',
    images: [{ url: '/img/услуга_изн.png', width: 1200, height: 630, alt: 'Инвентаризация зелёных насаждений' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Инвентаризация зеленых насаждений — заказать учет и паспортизацию территории',
    description: 'Проводим профессиональную инвентаризацию деревьев и кустарников с геопривязкой, фотофиксацией и подготовкой всей необходимой документации. Формируем актуальную цифровую базу зеленого фонда, которая помогает эффективно управлять территорией, планировать благоустройство и снижать эксплуатационные риски.',
    images: ['/img/услуга_изн.png'],
  },
};

export default function ServicesGreenInventoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}


