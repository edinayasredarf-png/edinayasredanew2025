import type { Metadata } from 'next';
import LhrPage from './LhrPage';

export const metadata: Metadata = {
  title: 'Разработка лесохозяйственных регламентов (ЛХР) — Единая среда',
  description: 'Разработка и актуализация лесохозяйственных регламентов: анализ исходных данных, расчёт нормативов, картографические приложения и сопровождение проекта.',
  alternates: { canonical: '/services/lhr' },
  openGraph: { title: 'Разработка лесохозяйственных регламентов — Единая среда', description: 'Подготовка новых ЛХР и внесение изменений в действующие регламенты.', url: '/services/lhr', images: [{ url: '/img/services/les/hero.avif' }] },
};
export default function Page() { return <LhrPage />; }
