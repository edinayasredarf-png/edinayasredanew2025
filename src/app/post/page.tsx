'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PostPageClient from '@/components/blog/PostPageClient';

export default function PostPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" /> }>
      <PostPageInner />
    </Suspense>
  );
}

function PostPageInner() {
  const sp = useSearchParams();
  const slug = (sp.get('s') || '').trim();
  return <PostPageClient slug={slug} />;
}
