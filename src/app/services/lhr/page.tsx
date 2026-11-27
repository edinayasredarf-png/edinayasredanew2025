import type { Metadata } from 'next';
import LhrPage from './LhrPage';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: { absolute: 'Разработка лесохозяйственных регламентов (ЛХР) — Единая среда' },
  description: 'Разработка и актуализация лесохозяйственных регламентов: анализ исходных данных, расчёт нормативов, картографические приложения и сопровождение проекта.',
  alternates: { canonical: '/services/lhr' },
  openGraph: { title: 'Разработка лесохозяйственных регламентов — Единая среда', description: 'Подготовка новых ЛХР и внесение изменений в действующие регламенты.', url: '/services/lhr', images: [{ url: '/img/services/les/hero.avif' }] },
};
export default function Page() {
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_CONFIG.url.replace(/\/$/, '')}/services/lhr#service`,
    name: 'Разработка лесохозяйственных регламентов (ЛХР)',
    serviceType: 'Разработка и актуализация лесохозяйственных регламентов',
    description: metadata.description,
    url: `${SITE_CONFIG.url.replace(/\/$/, '')}/services/lhr`,
    image: `${SITE_CONFIG.url.replace(/\/$/, '')}/img/services/les/hero.avif`,
    provider: { '@type': 'Organization', name: 'Единая среда', url: SITE_CONFIG.url },
    areaServed: { '@type': 'Country', name: 'Россия' },
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service).replace(/</g, '\\u003c') }} />
    <LhrPage />
  </>;
}
