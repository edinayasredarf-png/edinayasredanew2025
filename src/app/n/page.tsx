'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsPageClient from '@/components/blog/NewsPageClient';

export default function NPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" /> }>
      <NPageInner />
    </Suspense>
  );
}

function NPageInner() {
  const sp = useSearchParams();
  const slug = (sp.get('s') || '').trim();
  return <NewsPageClient slug={slug} />;
}
