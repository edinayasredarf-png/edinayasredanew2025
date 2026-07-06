'use client';

import React, { ReactNode, Suspense } from 'react';
import { BlogHeader } from './redesign/BlogHeader';

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="bg-[#F6F7FB] min-h-screen flex flex-col">
      <Suspense>
        <BlogHeader />
      </Suspense>
      <main className="flex-1 w-full mx-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
