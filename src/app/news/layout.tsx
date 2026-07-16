import React, { Suspense } from 'react';
import { BlogHeader } from '@/components/redesign/BlogHeader';

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white min-h-screen">
      <Suspense>
        <BlogHeader />
      </Suspense>
      {children}
    </div>
  );
}
