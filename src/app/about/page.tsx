import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'О компании — ГК Единая среда',
  description: 'Более 15 лет на рынке цифрового управления территориями. 500+ проектов в 40+ регионах России. Резидент Сколково. Реестр отечественного ПО. Добросовестный подрядчик по 44-ФЗ.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'О компании — ГК Единая среда',
    description: 'Более 15 лет на рынке. 500+ проектов в 40+ регионах. Резидент Сколково, реестр отечественного ПО.',
    url: 'https://xn--80aakbcct4b2aj7m.xn--p1ai/about',
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
