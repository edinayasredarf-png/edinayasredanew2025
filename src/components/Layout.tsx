// components/Layout.tsx

"use client";
import React, { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import Image from 'next/image';
import Link from 'next/link';
import AuthModal from './auth/AuthModal';
import { authStore } from '@/lib/authStore';
import StoriesStrip from "./StoriesStrip";
import MobileBottomNav from "./MobileBottomNav";

interface LayoutProps {
  children: ReactNode;
}

// ========================================
// ✅ КОМПОНЕНТ ДЛЯ УДАЛЕНИЯ ЯКОРЯ #f1
// ========================================
const HashCleaner: React.FC = () => {
  useEffect(() => {
    const cleanHash = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      // Удаляем ЛЮБОЙ якорь на главной странице
      if (hash && pathname === '/') {
        window.history.replaceState(null, '', pathname);
      }
    };

    // Очищаем сразу при загрузке
    cleanHash();

    // Следим за изменениями
    const handleChange = () => {
      cleanHash();
    };

    window.addEventListener('hashchange', handleChange);
    window.addEventListener('popstate', handleChange);

    // Дополнительная проверка через задержку
    const timer = setTimeout(() => {
      cleanHash();
    }, 100);

    return () => {
      window.removeEventListener('hashchange', handleChange);
      window.removeEventListener('popstate', handleChange);
      clearTimeout(timer);
    };
  }, []);

  return null;
};

// ========================================
// COOKIE BANNER
// ========================================
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
      {/* Десктоп — справа снизу */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-[100]">
        <div className="bg-[#292c32] rounded-2xl px-4 py-[14px] flex items-center gap-4 shadow-xl">
          <span className="text-white text-base font-normal font-[Raleway] leading-[1.6]">
            Пользуясь нашим сайтом, вы соглашаетесь<br/>
            с тем, что <a href="/documents" target="_blank" rel="noopener noreferrer" className="underline">мы используем cookies</a>
          </span>
          <button
            onClick={handleAgree}
            className="px-5 py-3 bg-[#0077FF] rounded-xl text-white text-base font-normal font-[Raleway] leading-[18px] hover:bg-[#005fcc] transition-colors whitespace-nowrap"
          >
            Принять
          </button>
        </div>
      </div>

      {/* Мобайл — по центру снизу с крестиком, выше мобильного меню */}
      <div className="flex md:hidden fixed bottom-24 left-0 w-full justify-center z-[130] px-4">
        <div className="bg-[#292c32] rounded-2xl px-4 py-[14px] flex items-center gap-3 shadow-xl w-full max-w-sm relative">
          <span className="text-white text-sm font-normal font-[Raleway] leading-[1.6] flex-1 pr-2">
            Пользуясь нашим сайтом, вы соглашаетесь с тем, что <a href="/documents" target="_blank" rel="noopener noreferrer" className="underline">мы используем cookies</a>
          </span>
          <button
            onClick={handleAgree}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-white hover:text-gray-300 transition-colors"
            aria-label="Закрыть"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

// ========================================
// ГЛАВНЫЙ LAYOUT КОМПОНЕНТ
// ========================================
const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Не показываем breadcrumbs на главной странице

  const handleMobileSubmenu = (menu: string) => {
    setOpenMobileSubmenu(openMobileSubmenu === menu ? null : menu);
  };

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
        {/* ✅ ОЧИСТКА ЯКОРЕЙ */}
        <HashCleaner />


        {/* ✅ HEADER */}
        <Header
          isMobileNavOpen={isMobileNavOpen}
          setIsMobileNavOpen={setIsMobileNavOpen}
        />
	<StoriesStrip />
        {/* ✅ МОБИЛЬНОЕ МЕНЮ */}
        {isMobileNavOpen && (
          <div className="relative z-50 w-full bg-black/95 rounded-b-2xl flex flex-col p-4 pt-2 shadow-2xl border border-white/10 animate-slide-down">
            <div className="flex items-center justify-end mb-4">
              <button
                className="p-2 text-white text-2xl"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Закрыть меню"
              >
                ×
              </button>
            </div>
            <ul className="flex flex-col gap-2 text-white text-base font-[Raleway] font-medium">
              <li>
                <Link href="/cases" className="block px-2 py-3 rounded-xl hover:bg-white/10 transition-colors" onClick={() => setIsMobileNavOpen(false)}>Кейсы</Link>
              </li>
              <li>
                <button
                  className="w-full flex items-center justify-between px-2 py-3 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
                  onClick={() => handleMobileSubmenu('platform')}
                >
                  <span className="flex items-center gap-2">Платформа</span>
                  <svg className={`w-5 h-5 ml-2 transition-transform ${openMobileSubmenu === 'platform' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {openMobileSubmenu === 'platform' && (
                  <ul className="pl-4 flex flex-col gap-1 mt-1">
                    <li><a href="https://edinayasreda.ru/" className="flex items-center gap-2 py-2 px-2 rounded hover:bg-white/10 transition-colors"><Image src="/icons/icon4.svg" width={20} height={20} alt="Войти в ЛК" />Войти в ЛК</a></li>
                    <li><a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" className="flex items-center gap-2 py-2 px-2 rounded hover:bg-white/10 transition-colors"><Image src="/icons/play.svg" width={20} height={20} alt="Мобильное приложение" />Мобильное приложение</a></li>
                  </ul>
                )}
              </li>
              <li>
                <button
                  className="w-full flex items-center justify-between px-2 py-3 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
                  onClick={() => handleMobileSubmenu('services')}
                >
                  <span className="flex items-center gap-2">Услуги</span>
                  <svg className={`w-5 h-5 ml-2 transition-transform ${openMobileSubmenu === 'services' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {openMobileSubmenu === 'services' && (
                  <ul className="pl-4 flex flex-col gap-1 mt-1">
                    <li><Link href="/services/inventory-burials" className="flex items-center gap-2 py-2 px-2 rounded hover:bg-white/10 transition-colors" onClick={() => setIsMobileNavOpen(false)}><Image src="/icons/document.svg" width={20} height={20} alt="Инвентаризация мест захоронений" />Инвентаризация мест захоронений</Link></li>
                    <li><Link href="/services/green-inventory" className="flex items-center gap-2 py-2 px-2 rounded hover:bg-white/10 transition-colors" onClick={() => setIsMobileNavOpen(false)}><Image src="/icons/document.svg" width={20} height={20} alt="Инвентаризация зеленых насаждений" />Инвентаризация зеленых насаждений</Link></li>
                    <li><Link href="/services/forest-management" className="flex items-center gap-2 py-2 px-2 rounded hover:bg-white/10 transition-colors" onClick={() => setIsMobileNavOpen(false)}><Image src="/icons/document.svg" width={20} height={20} alt="Лесоустройство" />Лесоустройство</Link></li>
                  </ul>
                )}
              </li>
              <li>
                <button
                  className="w-full flex items-center justify-between px-2 py-3 rounded-xl hover:bg-white/10 transition-colors focus:outline-none"
                  onClick={() => handleMobileSubmenu('company')}
                >
                  <span className="flex items-center gap-2">Компания</span>
                  <svg className={`w-5 h-5 ml-2 transition-transform ${openMobileSubmenu === 'company' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {openMobileSubmenu === 'company' && (
                  <ul className="pl-4 flex flex-col gap-1 mt-1">
                    <li><Link href="/about" className="flex items-center gap-2 py-2 px-2 rounded hover:bg-white/10 transition-colors" onClick={() => setIsMobileNavOpen(false)}><Image src="/icons/icon4.svg" width={20} height={20} alt="О компании" />О компании</Link></li>
                    <li><a href="/career" className="flex items-center gap-2 py-2 px-2 rounded hover:bg-white/10 transition-colors"><Image src="/icons/icon5.svg" width={20} height={20} alt="Карьера" />Карьера</a></li>
                    <li><a href="#" className="flex items-center gap-2 py-2 px-2 rounded hover:bg-white/10 transition-colors"><Image src="/icons/icon6.svg" width={20} height={20} alt="Партнерство" />Партнерство</a></li>
                  </ul>
                )}
              </li>
              <li>
                <Link href="/pricing" className="block px-2 py-3 rounded-xl hover:bg-white/10 transition-colors" onClick={() => setIsMobileNavOpen(false)}>Цены</Link>
              </li>
              <li>
                <Link href="/documents" className="block px-2 py-3 rounded-xl hover:bg-white/10 transition-colors" onClick={() => setIsMobileNavOpen(false)}>Документация</Link>
              </li>
              <li>
                <a href="#" className="block px-2 py-3 rounded-xl hover:bg-white/10 transition-colors">Партнерство</a>
              </li>
            </ul>
            <div className="flex flex-col gap-3 w-full mt-6">
              <button type="button" className="inline-flex items-center justify-center px-4 py-2.5 text-white text-base font-[Raleway] font-medium rounded-xl bg-[#0077FF] hover:bg-opacity-80 open-register-modal">Регистрация</button>
              <a href="https://edinayasreda.ru/" className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-white text-base font-[Raleway] font-medium rounded-xl bg-black hover:bg-opacity-80 transition-colors">Вход</a>
              <a href="#" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-white text-base font-[Raleway] font-medium rounded-xl border border-[#00D3E6] hover:bg-[#00d3e6]/10 open-consult-modal">Получить консультацию</a>
            </div>
            <div className="flex items-center gap-6 mt-8">
              <a href="https://t.me/edinayasredarf" title="Telegram"><Image src="/icons/tg.svg" width={24} height={24} alt="Telegram" /></a>
              <a href="https://vk.com/edinayasredarf" title="VK"><Image src="/icons/vk.svg" width={24} height={24} alt="VK" /></a>
              <a href="https://vkvideo.ru/@edinayasreda" title="VK Video"><Image src="/icons/vkvideo.svg" width={24} height={24} alt="VK Video" /></a>
              <a href="https://dzen.ru/edinayasreda" title="Dzen"><Image src="/icons/dzen.svg" width={24} height={24} alt="Dzen" /></a>
              <a href="https://www.youtube.com/@edinayasreda" title="Youtube"><Image src="/icons/youtube.svg" width={24} height={24} alt="Youtube" /></a>
            </div>
          </div>
        )}


        {/* ✅ ОСНОВНОЙ КОНТЕНТ */}
        <main className="flex-1 w-full mx-auto relative -mt-[20px] z-10">
          {children}
        </main>

        {/* ✅ FOOTER */}
        <Footer />

        {/* ✅ МОБИЛЬНОЕ ДНО МЕНЮ (как в Telegram 2026, жидкое стекло) */}
        <MobileBottomNav />

        {/* ✅ COOKIE BANNER */}
        <CookieBanner />

        {/* ✅ AUTH MODAL */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
  );
};

export default Layout;
