import { Metadata } from 'next';
import PartnershipPageClient from './PartnershipPageClient';

export const metadata: Metadata = {
  title: 'Партнёрство — Единая среда',
  description: 'Станьте партнёром или агентом ГК «Единая среда». Совместные проекты по инвентаризации и цифровому управлению территориями в муниципалитетах России.',
  alternates: { canonical: '/partnership' },
  openGraph: {
    title: 'Партнёрство — Единая среда',
    description: 'Партнёрские и агентские программы по цифровому управлению муниципальными территориями.',
    url: 'https://единаясреда.рф/partnership',
  },
};

export default function PartnershipPage() {
  return <PartnershipPageClient />;
}
