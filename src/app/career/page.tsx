import { Metadata } from 'next';
import CareerPageClient from './CareerPageClient';

export const metadata: Metadata = {
  title: 'Карьера — Единая среда',
  description: 'Вакансии в ГК «Единая среда» — инновационной компании в сфере цифрового управления территориями. ГИС-специалисты, разработчики, полевые инженеры.',
  alternates: { canonical: '/career' },
  openGraph: {
    title: 'Карьера — Единая среда',
    description: 'Вакансии в компании по цифровому управлению муниципальными территориями.',
    url: 'https://единаясреда.рф/career',
  },
};

export default function CareerPage() {
  return <CareerPageClient />;
}
