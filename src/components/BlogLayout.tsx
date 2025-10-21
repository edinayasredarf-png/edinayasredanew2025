'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
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
    <div className="bg-[#F6F7FB] pt-2 px-2 min-h-screen flex flex-col">
      <Header 
        isMobileNavOpen={false} 
        setIsMobileNavOpen={() => {}}
        isAuthenticated={isAuthenticated}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onSignOut={() => authStore.signOut()}
      />
      
      <main className="flex-1 w-full mx-auto relative -mt-[20px] z-10">
        {children}
      </main>
      
      <Footer />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
