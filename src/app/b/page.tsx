'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PostPageClient from '@/components/blog/PostPageClient';

export default function BPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" /> }>
      <BPageInner />
    </Suspense>
  );
}

function BPageInner() {
  const sp = useSearchParams();
  const slug = (sp.get('s') || '').trim();
  return <PostPageClient slug={slug} />;
}
