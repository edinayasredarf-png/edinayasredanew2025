import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import CasePageClient from './CasePageClient';
import { getCaseSeoBySlug } from '@/lib/seoServer';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: any): Promise<Metadata> {
  const raw = props?.params;
  const params = raw && typeof raw.then === 'function' ? await raw : raw;
  const slug = params?.slug as string;
  const fallbackTitle = 'Кейс';
  const fallbackDescription = 'Кейс компании «Единая среда» — цифровое управление территориями.';

  try {
    const seo = await getCaseSeoBySlug(slug);
    if (seo?.title) {
      const images = seo.image ? [seo.image] : undefined;
      return {
        title: seo.title,
        description: seo.description ?? fallbackDescription,
        alternates: { canonical: `/cases/${slug}` },
        openGraph: {
          type: 'article',
          title: seo.title,
          description: seo.description ?? fallbackDescription,
          images,
          publishedTime: seo.datePublished,
        },
        twitter: {
          card: 'summary_large_image',
          title: seo.title,
          description: seo.description ?? fallbackDescription,
          images,
        },
      };
    }
  } catch {
    // ignore
  }

  return { title: fallbackTitle, description: fallbackDescription };
}

export default async function CaseSlugPage(props: any) {
  const raw = props?.params;
  const params = raw && typeof raw.then === 'function' ? await raw : raw;
  const slug = params?.slug as string;

  let jsonLd: object | null = null;
  try {
    const seo = await getCaseSeoBySlug(slug);
    if (seo?.title) {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        articleSection: 'Кейсы',
        headline: seo.title,
        description: seo.description,
        image: seo.image,
        datePublished: seo.datePublished,
        dateModified: seo.dateModified ?? seo.datePublished,
        author: {
          '@type': 'Organization',
          name: 'Единая среда',
          url: 'https://xn--80aakbcct4b2aj7m.xn--p1ai',
        },
        publisher: {
          '@type': 'Organization',
          '@id': 'https://xn--80aakbcct4b2aj7m.xn--p1ai/#organization',
          name: 'Единая среда',
          logo: { '@type': 'ImageObject', url: 'https://xn--80aakbcct4b2aj7m.xn--p1ai/img/logo_dark.svg' },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://xn--80aakbcct4b2aj7m.xn--p1ai/cases/${slug}`,
        },
        inLanguage: 'ru-RU',
      };
    }
  } catch {
    // ignore
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={null}>
        <CasePageClient slug={slug} />
      </Suspense>
    </>
  );
}
