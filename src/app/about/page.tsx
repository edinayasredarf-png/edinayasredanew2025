import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: { absolute: 'О компании — ГК Единая среда' },
  description: 'Команда цифрового управления территориями работает с 2011 года. Резидент Сколково. Реестр отечественного ПО. Добросовестный подрядчик по 44-ФЗ.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'О компании — ГК Единая среда',
    description: 'Цифровые решения для управления территориями с 2011 года. Резидент Сколково, реестр отечественного ПО.',
    url: 'https://xn--80aakbcct4b2aj7m.xn--p1ai/about',
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
