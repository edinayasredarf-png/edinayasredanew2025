'use client';

import React, { ReactNode } from 'react';
import Footer from './Footer';

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="bg-[#F6F7FB] min-h-screen flex flex-col">
      <main className="flex-1 w-full mx-auto relative z-10">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
