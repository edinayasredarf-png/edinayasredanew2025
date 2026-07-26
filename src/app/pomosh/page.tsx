import type { Metadata } from 'next';
import PomoshPageClient from './PomoshPageClient';

export const metadata: Metadata = {
  title: 'Помогите городу — Единая среда',
  description:
    'Внесите данные о поваленных деревьях и повреждениях на карту «Единой среды» — это помогает оперативному штабу быстрее реагировать. Оставьте информацию или получите доступ к системе.',
  alternates: { canonical: '/pomosh' },
  // страница-кампания с гостевым доступом — не индексируем
  robots: { index: false, follow: true },
};

export default function PomoshPage() {
  return <PomoshPageClient />;
}
