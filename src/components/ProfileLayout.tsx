'use client';

import React, { ReactNode, Suspense, useEffect, useState } from 'react';
import { BlogHeader } from './redesign/BlogHeader';
import AuthModal from './auth/AuthModal';

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenAuthModal = () => setIsAuthModalOpen(true);
    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Suspense>
        <BlogHeader />
      </Suspense>
      <main className="flex-1 w-full mx-auto relative z-10">
        {children}
      </main>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
