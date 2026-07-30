'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Script from 'next/script';
import AuthModal from './auth/AuthModal';
import StoriesStrip from './StoriesStrip';
import Breadcrumbs from './Breadcrumbs';
import MobileBottomNav from './MobileBottomNav';
import { RedesignHeader } from '@/components/redesign/RedesignHeader';
import { RedesignFooter } from '@/components/redesign/RedesignFooter';

interface LayoutProps {
  children: ReactNode;
  /** Вариант шапки. 'test' — экспериментальный дизайн для страницы /test. */
  headerVariant?: 'default' | 'test';
  /** Скрыть хлебные крошки под шапкой (напр. если крошки уже есть в hero). */
  hideBreadcrumbs?: boolean;
}

const HashCleaner: React.FC = () => {
  useEffect(() => {
    const cleanHash = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      if (hash && pathname === '/') {
        window.history.replaceState(null, '', pathname);
      }
    };

    cleanHash();
    const handleChange = () => cleanHash();
    window.addEventListener('hashchange', handleChange);
    window.addEventListener('popstate', handleChange);
    const timer = setTimeout(cleanHash, 100);

    return () => {
      window.removeEventListener('hashchange', handleChange);
      window.removeEventListener('popstate', handleChange);
      clearTimeout(timer);
    };
  }, []);

  return null;
};

const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const agreed = localStorage.getItem('cookie_agreed');
      if (!agreed) setVisible(true);
    }
  }, []);

  const handleAgree = () => {
    localStorage.setItem('cookie_agreed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="hidden md:flex fixed bottom-6 right-6 z-[100]">
        <div className="bg-[#292c32] rounded-2xl px-4 py-[14px] flex items-center gap-4 shadow-xl">
          <span className="text-white text-base leading-[1.6]">
            Пользуясь нашим сайтом, вы соглашаетесь
            <br />
            с тем, что{' '}
            <a href="/documents" target="_blank" rel="noopener noreferrer" className="underline">
              мы используем cookies
            </a>
          </span>
          <button
            type="button"
            onClick={handleAgree}
            className="px-5 py-3 bg-[#029cda] rounded-xl text-white text-base leading-[18px] hover:bg-[#029cda]/90 transition-colors whitespace-nowrap"
          >
            Принять
          </button>
        </div>
      </div>

      <div className="flex md:hidden fixed bottom-24 left-0 w-full justify-center z-[130] px-4">
        <div className="bg-[#292c32] rounded-2xl px-4 py-[14px] flex items-center gap-3 shadow-xl w-full max-w-sm relative">
          <span className="text-white text-sm leading-[1.6] flex-1 pr-2">
            Пользуясь нашим сайтом, вы соглашаетесь с тем, что{' '}
            <a href="/documents" target="_blank" rel="noopener noreferrer" className="underline">
              мы используем cookies
            </a>
          </span>
          <button
            type="button"
            onClick={handleAgree}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
            aria-label="Закрыть"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

const Layout = ({ children, headerVariant = 'default', hideBreadcrumbs = false }: LayoutProps) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenAuthModal = () => setIsAuthModalOpen(true);
    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  return (
    <div className="redesign min-h-screen w-full flex flex-col bg-white">
      <HashCleaner />
      <RedesignHeader variant={headerVariant} />
      {/* На тестовом лендинге прячем сторис и хлебные крошки, чтобы hero уходил под самый верх */}
      {headerVariant !== 'test' && (
        <>
          <StoriesStrip />
          {!hideBreadcrumbs && <Breadcrumbs />}
        </>
      )}
      <main className="flex-1 w-full">{children}</main>
      <RedesignFooter variant={headerVariant} />
      <MobileBottomNav />
      <CookieBanner />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
      <Script
        id="bitrix24-tracker"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,u){var s=d.createElement('script');s.async=true;s.src=u+'?'+(Date.now()/60000|0);var h=d.getElementsByTagName('script')[0];h.parentNode.insertBefore(s,h);})(window,document,'https://cdn-ru.bitrix24.ru/b32921504/crm/tag/call.tracker.js');`,
        }}
      />
    </div>
  );
};

export default Layout;
