'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import AuthModal from './auth/AuthModal';
import { authStore } from '@/lib/authStore';

interface BlogLayoutProps {
  children: ReactNode;
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Подписываемся на изменения состояния аутентификации
  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setIsAuthenticated(authStore.isAuthenticated());
    });

    // Устанавливаем начальное состояние
    setIsAuthenticated(authStore.isAuthenticated());

    return unsubscribe;
  }, []);

  // Обработчик события для открытия модального окна аутентификации
  useEffect(() => {
    const handleOpenAuthModal = () => {
      setIsAuthModalOpen(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    setIsAuthenticated(true);
  };

  return (
    <div className="bg-[#F6F7FB] min-h-screen flex flex-col">
      <main className="flex-1 w-full mx-auto">
        {children}
      </main>


      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
