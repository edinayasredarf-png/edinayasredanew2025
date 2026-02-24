'use client';

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import NewsPageClient from '@/components/blog/NewsPageClient';
import { getNewsSeoBySlug } from '@/lib/seoServer';

// MUI Skeleton
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

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
        openGraph: { type: 'article', title: seo.title, description: seo.description ?? fallbackDescription, images },
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

  const NewsSkeleton = () => (
    <div className="max-w-[800px] mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      {/* Заголовок */}
      <Skeleton variant="text" width="65%" height={40} sx={{ borderRadius: 6 }} animation="wave" />

      {/* Дата */}
      <Skeleton variant="text" width="25%" height={20} sx={{ borderRadius: 4 }} animation="wave" />

      {/* Основное изображение */}
      <Skeleton variant="rectangular" width="100%" height={300} sx={{ borderRadius: 12 }} animation="wave" />

      {/* Основной текст */}
      <Stack spacing={2}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 - i * 5}%`} height={20} sx={{ borderRadius: 4 }} animation="wave" />
        ))}
      </Stack>

      {/* Подзаголовки или выделенные блоки */}
      <Stack spacing={1}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${60 - i * 10}%`} height={28} sx={{ borderRadius: 4 }} animation="wave" />
        ))}
      </Stack>

      {/* Дополнительные абзацы */}
      <Stack spacing={1}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${90 - i * 15}%`} height={18} sx={{ borderRadius: 4 }} animation="wave" />
        ))}
      </Stack>
    </div>
  );

  return (
    <Suspense fallback={<NewsSkeleton />}>
      <NewsPageClient slug={slug} />
    </Suspense>
  );
}