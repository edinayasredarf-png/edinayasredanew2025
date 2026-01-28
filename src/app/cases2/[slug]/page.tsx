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
  const fallbackDescription = 'Кейс компании «Единая среда».';

  try {
    const seo = await getCaseSeoBySlug(slug);
    if (seo?.title) {
      const images = seo.image ? [seo.image] : undefined;
      return {
        // title template из src/app/layout.tsx добавит " | Единая среда"
        title: seo.title,
        description: seo.description ?? fallbackDescription,
        openGraph: {
          type: 'article',
          title: seo.title,
          description: seo.description ?? fallbackDescription,
          images,
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

  return {
    title: fallbackTitle,
    description: fallbackDescription,
  };
}

export default async function CaseSlugPage(props: any) {
  const raw = props?.params;
  const params = raw && typeof raw.then === 'function' ? await raw : raw;
  const slug = params?.slug as string;

  return (
    <Suspense fallback={null}>
      <CasePageClient slug={slug} />
    </Suspense>
  );
}

