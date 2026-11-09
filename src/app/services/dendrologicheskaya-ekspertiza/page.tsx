import type { Metadata } from 'next';
import DendrologyPageClient from './DendrologyPageClient';
import { SITE_CONFIG } from '@/lib/config';

const title = 'Дендрологическая экспертиза в Ростове-на-Дону — Единая среда';
const description = 'Обследование деревьев и кустарников, установление причин повреждения и гибели, оценка пересадки и компенсационной стоимости. Заключение эксперта в Ростове-на-Дону и Ростовской области.';
const path = '/services/dendrologicheskaya-ekspertiza';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: path },
  openGraph: {
    title, description, url: path, type: 'website',
    images: [{ url: '/img/услуга_изн.png', alt: 'Дендрологическая экспертиза деревьев и кустарников' }],
  },
  twitter: { card: 'summary_large_image', title, description, images: ['/img/услуга_изн.png'] },
};

export default function DendrologyPage() {
  const service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Дендрологическая экспертиза',
    serviceType: 'Обследование деревьев и кустарников',
    description,
    url: `${SITE_CONFIG.url.replace(/\/$/, '')}${path}`,
    provider: { '@type': 'Organization', name: 'Единая среда', url: SITE_CONFIG.url },
    areaServed: [
      { '@type': 'City', name: 'Ростов-на-Дону' },
      { '@type': 'AdministrativeArea', name: 'Ростовская область' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service).replace(/</g, '\\u003c') }} />
      <DendrologyPageClient />
    </>
  );
}
