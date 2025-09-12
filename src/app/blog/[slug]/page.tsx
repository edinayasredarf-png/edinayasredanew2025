'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import PostPageClient from '@/components/blog/PostPageClient';

export default function BlogPostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f2f3f7] flex items-center justify-center">Загрузка…</div>}>
      <BlogPostPageInner />
    </Suspense>
  );
}

function BlogPostPageInner() {
  const params = useParams();
  const slug = params.slug as string;
  return <PostPageClient slug={slug} />;
}
