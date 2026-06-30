import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import NewsPageClient from '@/components/blog/NewsPageClient';
import { getNewsSeoBySlug } from '@/lib/seoServer';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: any): Promise<Metadata> {
  const raw = props?.params;
  const params = raw && typeof raw.then === 'function' ? await raw : raw;
  const slug = params?.slug as string;
  const fallbackTitle = 'Новость';
  const fallbackDescription = 'Новости платформы «Единая среда». Обновления, анонсы и события.';

  try {
    const seo = await getNewsSeoBySlug(slug);
    if (seo?.title) {
      const images = seo.image ? [seo.image] : undefined;
      return {
        title: seo.title,
        description: seo.description ?? fallbackDescription,
        alternates: { canonical: `/news/${slug}` },
        openGraph: {
          type: 'article',
          title: seo.title,
          description: seo.description ?? fallbackDescription,
          images,
          publishedTime: seo.datePublished,
          modifiedTime: seo.dateModified,
        },
        twitter: { card: 'summary_large_image', title: seo.title, description: seo.description ?? fallbackDescription, images },
      };
    }
  } catch {
    // ignore
  }

  return {
    title: fallbackTitle,
    description: fallbackDescription,
    openGraph: { type: 'article', title: fallbackTitle, description: fallbackDescription },
    twitter: { card: 'summary_large_image', title: fallbackTitle, description: fallbackDescription },
  };
}

export default async function NewsSlugPage(props: any) {
  const raw = props?.params;
  const params = raw && typeof raw.then === 'function' ? await raw : raw;
  const slug = params?.slug as string;

  let jsonLd: object | null = null;
  try {
    const seo = await getNewsSeoBySlug(slug);
    if (seo?.title) {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: seo.title,
        description: seo.description,
        image: seo.image,
        datePublished: seo.datePublished,
        dateModified: seo.dateModified ?? seo.datePublished,
        author: {
          '@type': 'Organization',
          name: 'Единая среда',
          url: 'https://единаясреда.рф',
        },
        publisher: {
          '@type': 'Organization',
          '@id': 'https://единаясреда.рф/#organization',
          name: 'Единая среда',
          logo: { '@type': 'ImageObject', url: 'https://единаясреда.рф/img/logo_dark.svg' },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `https://единаясреда.рф/news/${slug}`,
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
      <Suspense fallback={<div className="min-h-screen bg-[#F6F7F9] flex items-center justify-center">Загрузка…</div>}>
        <NewsPageClient slug={slug} />
      </Suspense>
    </>
  );
}
