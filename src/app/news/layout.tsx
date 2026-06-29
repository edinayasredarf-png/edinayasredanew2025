import React, { Suspense } from 'react';
import { BlogHeader } from '@/components/redesign/BlogHeader';

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f2f3f7] min-h-screen">
      <Suspense>
        <BlogHeader />
      </Suspense>
      {children}
    </div>
  );
}
