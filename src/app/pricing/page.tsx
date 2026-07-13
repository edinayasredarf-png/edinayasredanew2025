import { Metadata } from 'next';
import PricingPageClient from './PricingPageClient';

export const metadata: Metadata = {
  title: 'Тарифы — Единая среда',
  description: 'Стоимость платформы «Единая среда» и услуг по инвентаризации территорий. Индивидуальные тарифы для муниципалитетов, расчёт под задачи. Запросите КП.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Тарифы — Единая среда',
    description: 'Стоимость платформы и услуг по инвентаризации для муниципалитетов. Запросите индивидуальное КП.',
    url: 'https://xn--80aakbcct4b2aj7m.xn--p1ai/pricing',
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
