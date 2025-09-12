'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import NewsPageClient from '@/components/blog/NewsPageClient';

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f2f3f7] flex items-center justify-center">Загрузка…</div>}>
      <NewsPageInner />
    </Suspense>
  );
}

function NewsPageInner() {
  const params = useParams();
  const slug = params.slug as string;
  return <NewsPageClient slug={slug} />;
}
