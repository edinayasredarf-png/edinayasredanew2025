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
    <div className="fixed bottom-4 left-0 w-full flex justify-center z-[100] pointer-events-none">
      <div className="bg-white border border-[#0077FF] shadow-xl rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center gap-4 max-w-2xl w-full mx-2 pointer-events-auto animate-fade-in">
        <span className="text-black text-sm md:text-base flex-1 text-center md:text-left">
          Мы используем файлы cookie для улучшения работы сайта. Подробнее в разделе{' '}
          <a href="/documents" className="text-[#0077FF] underline hover:text-[#005fcc] transition-colors" target="_blank" rel="noopener noreferrer">Документация</a>.
        </span>
        <button
          onClick={handleAgree}
          className="px-6 py-2 rounded-xl bg-[#0077FF] text-white font-[Raleway] font-medium hover:bg-[#005fcc] transition-colors text-sm md:text-base"
        >
          Ок, понятно
        </button>
      </div>
    </div>
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
