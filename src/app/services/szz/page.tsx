import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import SzzPage from './SzzPage';
const title = 'Разработка и установление санитарно-защитных зон (СЗЗ) — Единая среда';
const description = 'Проекты СЗЗ для кладбищ, муниципальных и производственных объектов: расчёты, организация исследований, сопровождение экспертизы и установления границ, цифровой реестр.';
const path = '/services/szz';
export const metadata: Metadata = {
  title: { absolute: title }, description, alternates: { canonical: path },
  openGraph: { title, description, url: path, type: 'website', images: [{ url: '/img/services/szz/hero.avif', alt: 'Разработка санитарно-защитных зон' }] },
  twitter: { card: 'summary_large_image', title, description, images: ['/img/services/szz/hero.avif'] },
};
export default function Page() {
  const base = SITE_CONFIG.url.replace(/\/$/, '');
  const schema = { '@context': 'https://schema.org', '@type': 'Service', '@id': `${base}${path}#service`, name: 'Разработка и установление санитарно-защитных зон (СЗЗ)', serviceType: 'Разработка проекта СЗЗ и сопровождение установления границ', description, url: `${base}${path}`, image: `${base}/img/services/szz/hero.avif`, provider: { '@type': 'Organization', name: 'Единая среда', url: base }, areaServed: { '@type': 'Country', name: 'Россия' } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /><SzzPage /></>;
}
