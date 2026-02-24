// ФАЙЛ: src/app/blog/[slug]/page.tsx
import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PostPageClient from '@/components/blog/PostPageClient';
import { getPostSeoBySlug } from '@/lib/seoServer';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

// ⚠️ Важно: Никаких 'use client' здесь! Страница должна быть серверной
export const dynamic = 'force-dynamic';

// Генерация SEO-метаданных — серверная функция
export async function generateMetadata(props: any): Promise<Metadata> {
  const raw = props?.params;
  const params = raw && typeof raw.then === 'function' ? await raw : raw;
  const slug = params?.slug as string;

  const fallbackTitle = 'Статья';
  const fallbackDescription =
    'Статья блога «Единая среда». Новости, практика и кейсы цифровизации.';

  try {
    const seo = await getPostSeoBySlug(slug);
    if (seo?.title) {
      const images = seo.image ? [seo.image] : undefined;
      return {
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
    openGraph: { type: 'article', title: fallbackTitle, description: fallbackDescription },
    twitter: { card: 'summary_large_image', title: fallbackTitle, description: fallbackDescription },
  };
}

// Skeleton для загрузки поста
function PostSkeleton() {
  return (
    <div className="max-w-[800px] mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      <Skeleton variant="text" width="70%" height={48} sx={{ borderRadius: 6 }} animation="wave" />
      <Skeleton variant="rectangular" width="100%" height={400} sx={{ borderRadius: 12 }} animation="wave" />
      <Stack spacing={2}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={`${100 - i * 5}%`}
            height={24}
            sx={{ borderRadius: 4 }}
            animation="wave"
          />
        ))}
      </Stack>
      <Stack spacing={1}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={`${60 - i * 10}%`}
            height={32}
            sx={{ borderRadius: 4 }}
            animation="wave"
          />
        ))}
      </Stack>
    </div>
  );
}

// Серверная страница с Suspense
export default async function BlogPostPage(props: any) {
  const raw = props?.params;
  const params = raw && typeof raw.then === 'function' ? await raw : raw;
  const slug = params?.slug as string;

  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostPageClient slug={slug} />
    </Suspense>
  );
}