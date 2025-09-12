'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from './Button';
import { useModal } from './ModalProvider';
import { usePathname } from 'next/navigation';
import ThemedIcon from '@/components/ThemedIcon';

interface HeaderProps {
  onRegisterClick?: () => void;
  onConsultClick?: () => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  onRegisterClick,
  onConsultClick,
  isMobileNavOpen,
  setIsMobileNavOpen,
}) => {
  const pathname = usePathname();
  const { openRegister, openConsult } = useModal();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);

  // ----- Sticky (плавающий) белый header при скролле вверх -----
  const [showSticky, setShowSticky] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        setIsAtTop(y < 8);

        const dy = y - lastY;
        if (dy > 4) setShowSticky(false);           // вниз — прячем
        else if (dy < -4) setShowSticky(y > 120);   // вверх — показываем (после 120px)
        lastY = y;
        ticking = false;
      });
      ticking = true;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Закрывать раскрытые меню при смене маршрута + закрыть моб. оверлей
  useEffect(() => {
    setOpenMenu(null);
    setOpenMobileSubmenu(null);
    setIsMobileNavOpen(false);
  }, [pathname, setIsMobileNavOpen]);

  // Блокировка скролла body, закрытие по ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (isMobileNavOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = prev || '';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isMobileNavOpen, setIsMobileNavOpen]);

  // ------------------------------------------------------------

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };
  const handleMobileSubmenu = (menu: string) => {
    setOpenMobileSubmenu(openMobileSubmenu === menu ? null : menu);
  };

  const isActive = (href: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  // Белый «базовый» header на страницах кейсов
  const isLight = pathname?.startsWith('/cases/');

  const isServicesActive = pathname?.startsWith('/services');
  const isCompanyActive = ['/about', '/career'].some((p) => pathname?.startsWith(p));

  // Подмена логотипов
  const logoDesktopSrc = isLight ? '/img/logo_dark.svg' : '/img/logo.svg';
  const logoMobileSrc = isLight ? '/img/logo-mobile-dark.svg' : '/img/logo-mobile.svg';

  const navLinkBase =
    'px-3 py-2.5 rounded-xl text-sm md:text-base lg:text-md transition-colors';
  const navText = isLight ? 'text-[#212121]' : 'text-white';
  const navHover = isLight ? 'hover:bg-black/5' : 'hover:bg-white/10';
  const activeBox = isLight
    ? 'outline outline-1 outline-[#E3E8F2]'
    : 'outline outline-1 outline-white/25';

  const dropdownMenuCls = `dropdown-menu absolute left-0 top-full mt-3 flex flex-col min-w-[320px] ${
    isLight ? 'bg-white text-[#19191a]' : 'bg-black text-white'
  } rounded-2xl shadow-xl z-50 p-6 gap-2 animate-fade-in border ${
    isLight ? 'border-gray-200' : 'border-white/10'
  }`;
  const dropdownItemHover = `flex items-center gap-3 py-2 px-3 rounded-xl ${
    isLight ? 'hover:bg-black/5' : 'hover:bg-white/10'
  } transition-colors`;

  const consultBtnCls = `hidden lg:inline-flex items-center justify-center gap-2 px-4 py-[9px] ${
    isLight ? 'text-[#212121] border-[#00D3E6]' : 'text-white border-[#00D3E6]'
  } text-base font-medium rounded-xl border hover:bg-[#00d3e6]/10 transition-colors`;
  const loginBtnCls = `hidden lg:inline-flex items-center justify-center gap-2.5 px-4 py-2.5 ${
    isLight ? 'text-[#212121] bg-[#F6F7F9]' : 'text-white bg-[#212121]'
  } text-base font-medium rounded-xl hover:bg-opacity-80 transition-colors`;

  return (
    <>
      {/* Плавающий белый хедер, появляющийся при скролле вверх */}
      <div
        className={`fixed top-0 left-0 right-0 z-[70] transition-transform duration-300 ${
          showSticky && !isAtTop ? 'translate-y-0' : '-translate-y-full'
        }`}
        aria-hidden={!showSticky}
      >
        <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-black/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Лого */}
            <Link href="/" className="flex items-center">
              <Image
                src="/img/logo_dark.svg"
                alt="ES"
                width={140}
                height={40}
                className="w-[140px] h-auto"
              />
            </Link>

            {/* Правый блок: десктоп — 3 кнопки, мобайл — бургер + Регистрация */}
            <div className="flex items-center gap-2">
              {/* Мобайл: бургер */}
              <button
                className="md:hidden inline-flex items-center justify-center px-3 py-2 rounded-xl bg-[#F1F2F4] text-[#212121]"
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Открыть меню"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Мобайл: Регистрация */}
              <div className="md:hidden">
                <Button
                  onClick={onRegisterClick ?? openRegister}
                  variant="primary"
                  className="!py-2"
                >
                  Регистрация
                </Button>
              </div>

              {/* Десктоп: 3 кнопки */}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  (onConsultClick ?? openConsult)();
                }}
                className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-[9px] text-[#212121] text-base font-medium rounded-xl border border-[#00D3E6] hover:bg-[#00d3e6]/10 transition-colors"
              >
                <ThemedIcon src="/icons/icon3.svg" size={20} />
                <span>Получить консультацию</span>
              </a>
              <a
                href="https://edinayasreda.ru/"
                className="hidden md:inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-[#212121] text-base font-medium rounded-xl bg-[#F6F7F9] hover:bg-black/5 transition-colors"
              >
                <ThemedIcon src="/icons/icon4.svg" size={20} />
                <span>Вход</span>
              </a>
              <div className="hidden md:block">
                <Button onClick={onRegisterClick ?? openRegister} variant="primary">
                  Регистрация
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной header (тема меняется по роуту) */}
      <header className={`${isLight ? 'bg-white' : 'bg-black'} rounded-t-[20px] relative z-20 w-full`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Оверлей блюра при открытом подменю на десктопе */}
          {openMenu && (
            <div
              className="fixed inset-0 z-40 backdrop-blur-sm bg-black/40 transition-all duration-500 opacity-100"
              onClick={() => setOpenMenu(null)}
              aria-label="Закрыть меню"
            />
          )}

          {/* Top Header */}
          <div className="flex items-center justify-between h-28">
            {/* Бургер + логотипы */}
            <div className="flex items-center gap-0">
              <button
                className={`logo-burger p-2 gap-2.5 px-4 py-2.5 ${
                  isLight ? 'text-[#212121] bg-[#F1F2F4]' : 'text-white bg-[#333]'
                } text-base font-medium rounded-xl hover:bg-opacity-80 md:hidden`}
                onClick={() => setIsMobileNavOpen(true)}
                aria-label="Открыть меню"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-16 6h16" />
                </svg>
              </button>

              {/* Десктопный логотип */}
              <Link href="/" title="ES" className="items-center hidden md:flex">
                <Image
                  src={logoDesktopSrc}
                  alt="ES Logo Desktop"
                  width={166}
                  height={45}
                  className="logo-desktop w-[166px] h-[45px]"
                />
              </Link>

              {/* Мобильный логотип */}
              <Link href="/" title="ES" className="items-center flex md:hidden">
                <Image
                  src={logoMobileSrc}
                  alt="ES Logo Mobile"
                  width={120}
                  height={45}
                  className="logo-mobile w-auto h-auto px-4"
                />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  (onConsultClick ?? openConsult)();
                }}
                className={isLight
                  ? 'hidden lg:inline-flex items-center justify-center gap-2 px-4 py-[9px] text-[#212121] text-base font-medium rounded-xl border border-[#00D3E6] hover:bg-[#00d3e6]/10 transition-colors'
                  : 'hidden lg:inline-flex items-center justify-center gap-2 px-4 py-[9px] text-white text-base font-medium rounded-xl border border-[#00D3E6] hover:bg-[#00d3e6]/10 transition-colors'}
              >
                <ThemedIcon src="/icons/icon3.svg" size={24} alt="" />
                <span>Получить консультацию</span>
              </a>
              <a href="https://edinayasreda.ru/" className={isLight
                ? 'hidden lg:inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-[#212121] text-base font-medium rounded-xl bg-[#F6F7F9] hover:bg-black/5 transition-colors'
                : 'hidden lg:inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-white text-base font-medium rounded-xl bg-[#212121] hover:bg-opacity-80 transition-colors'}
              >
                <ThemedIcon src="/icons/icon4.svg" size={24} alt="" />
                <span>Вход</span>
              </a>
              <Button onClick={onRegisterClick ?? openRegister} variant="primary" className="open-register-modal">
                Регистрация
              </Button>
            </div>
          </div>

          {/* Навигация (десктоп) */}
          <nav className={`border-t ${isLight ? 'border-black/10' : 'border-white/30'} border-t-[1px] relative z-50`}>
            <div className="w-full lg:flex hidden flex-row items-center justify-between lg:h-[70px]">
              <ul className="flex flex-row items-center gap-3 w-full">
                <li>
                  <Link
                    href="/cases/"
                    className={`${navLinkBase} ${navText} ${navHover} ${isActive('/cases/') ? activeBox : ''}`}
                  >
                    Кейсы
                  </Link>
                </li>

                {/* Платформа */}
                <li className="relative">
                  <button
                    type="button"
                    onClick={() => handleMenuClick('platform')}
                    className={`${navLinkBase} ${navText} ${navHover} flex items-center gap-1 dropdown-toggle focus:outline-none`}
                  >
                    Платформа
                    <svg
                      className="w-[17px] h-[17px] ml-1 transition-transform"
                      style={{ transform: openMenu === 'platform' ? 'rotate(180deg)' : undefined }}
                      viewBox="0 0 17 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.4911 6.20898L8.50013 10.1999L4.50928 6.20898"
                        stroke="currentColor"
                        strokeWidth="1.38889"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {openMenu === 'platform' && (
                    <div className={dropdownMenuCls}>
                      <a href="https://edinayasreda.ru/" className={dropdownItemHover}>
                        <ThemedIcon src="/icons/icon4.svg" size={24} className="mr-1" /> Войти в ЛК
                      </a>
                      <Link href="#" className={dropdownItemHover}>
                        <ThemedIcon src="/icons/CPU.svg" size={24} className="mr-1" /> Тех. характеристики
                      </Link>
                      <a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" className={dropdownItemHover}>
                        <ThemedIcon src="/icons/Mobile.svg" size={24} className="mr-1" /> Мобильное приложение
                      </a>
                    </div>
                  )}
                </li>

                {/* Услуги */}
                <li className="relative">
                  <button
                    type="button"
                    onClick={() => handleMenuClick('services')}
                    className={`${navLinkBase} ${navText} ${navHover} ${
                      isServicesActive ? activeBox : ''
                    } flex items-center gap-1 dropdown-toggle focus:outline-none`}
                  >
                    Услуги
                    <svg
                      className="w-[17px] h-[17px] ml-1 transition-transform"
                      style={{ transform: openMenu === 'services' ? 'rotate(180deg)' : undefined }}
                      viewBox="0 0 17 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.4911 6.20898L8.50013 10.1999L4.50928 6.20898"
                        stroke="currentColor"
                        strokeWidth="1.38889"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {openMenu === 'services' && (
                    <div className={dropdownMenuCls}>
                      <Link href="/services/inventory-burials" className={dropdownItemHover}>
                        <ThemedIcon src="/icons/Cemetery.svg" size={24} className="mr-1" />
                        Инвентаризация мест захоронений
                      </Link>
                      <Link href="/services/green-inventory" className={dropdownItemHover}>
                        <ThemedIcon src="/icons/Tree.svg" size={24} className="mr-1" />
                        Инвентаризация зеленых насаждений
                      </Link>
                      <Link href="/services/forest-management" className={dropdownItemHover}>
                        <ThemedIcon src="/icons/Forest.svg" size={24} className="mr-1" />
                        Лесоустройство
                      </Link>

                      <div className="mt-3 pt-3 border-t border-black/10">
                        <Link
                          href="/services"
                          className={`w-full inline-flex ${
                            isLight
                              ? 'bg-[#F6F7F9] text-[#212121] hover:bg-black/5'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          } items-center justify-center gap-2 py-2.5 rounded-xl transition-colors`}
                        >
                          <ThemedIcon src="/icons/arrow_right.svg" size={20} />
                          Посмотреть все услуги
                        </Link>
                      </div>
                    </div>
                  )}
                </li>

                {/* Компания (без «Партнерство») */}
                <li className="relative">
                  <button
                    type="button"
                    onClick={() => handleMenuClick('company')}
                    className={`${navLinkBase} ${navText} ${navHover} ${
                      isCompanyActive ? activeBox : ''
                    } flex items-center gap-1 dropdown-toggle focus:outline-none`}
                  >
                    Компания
                    <svg
                      className="w-[17px] h-[17px] ml-1 transition-transform"
                      style={{ transform: openMenu === 'company' ? 'rotate(180deg)' : undefined }}
                      viewBox="0 0 17 17"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.4911 6.20898L8.50013 10.1999L4.50928 6.20898"
                        stroke="currentColor"
                        strokeWidth="1.38889"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {openMenu === 'company' && (
                    <div className={dropdownMenuCls}>
                      <Link href="/about" className={dropdownItemHover}>
                        <ThemedIcon src="/icons/City.svg" size={24} className="mr-1" /> О компании
                      </Link>
                      <Link href="/career" className={dropdownItemHover}>
                        <ThemedIcon src="/icons/Job.svg" size={24} className="mr-1" /> Карьера
                      </Link>
                    </div>
                  )}
                </li>

                <li>
                  <Link
                    href="/pricing"
                    className={`${navLinkBase} ${navText} ${navHover} ${isActive('/pricing') ? activeBox : ''}`}
                  >
                    Цены
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documents"
                    className={`${navLinkBase} ${navText} ${navHover} ${isActive('/documents') ? activeBox : ''}`}
                  >
                    Документация
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contacts"
                    className={`${navLinkBase} ${navText} ${navHover} ${isActive('/contacts') ? activeBox : ''}`}
                  >
                    Контакты
                  </Link>
                </li>
                <li>
                  <Link
                    href="/partnership"
                    className={`${navLinkBase} ${navText} ${navHover} ${isActive('/partnership') ? activeBox : ''}`}
                  >
                    Партнерство
                  </Link>
                </li>
              </ul>
            </div>

            {/* Мобильное меню — УБРАНО из хедера и вынесено в глобальный оверлей ниже */}
          </nav>
        </div>
      </header>

      {/* ====== ГЛОБАЛЬНЫЙ МОБИЛЬНЫЙ ОВЕРЛЕЙ-МЕНЮ (фикс, на весь экран) ====== */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileNavOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Верхняя панель внутри оверлея */}
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 border-b border-black/10">
              <Link href="/" onClick={() => setIsMobileNavOpen(false)} className="flex items-center">
                <Image src="/img/logo_dark.svg" alt="ES" width={140} height={40} className="w-[140px] h-auto" />
              </Link>
              <div className="flex items-center gap-2">
                <Button onClick={onRegisterClick ?? openRegister} variant="primary" className="!py-2">
                  Регистрация
                </Button>
                <button
                  aria-label="Закрыть меню"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F1F2F4] text-[#212121]"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Контент меню (тот же порядок, что в прежнем мобильном меню) */}
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/cases/"
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`block text-[#212121] hover:bg-black/5 px-3 py-3 rounded-xl ${isActive('/cases/') ? 'outline outline-1 outline-[#E3E8F2]' : ''}`}
                  >
                    Кейсы
                  </Link>
                </li>

                {/* Платформа */}
                <li>
                  <button
                    onClick={() => handleMobileSubmenu('platform')}
                    className="w-full text-left text-[#212121] hover:bg-black/5 px-3 py-3 rounded-xl flex items-center justify-between"
                  >
                    <span>Платформа</span>
                    <svg className={`w-5 h-5 transition-transform ${openMobileSubmenu === 'platform' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {openMobileSubmenu === 'platform' && (
                    <div className="mt-1 ml-3 flex flex-col gap-1">
                      <a href="https://edinayasreda.ru/" className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-black/5">
                        <ThemedIcon src="/icons/icon4.svg" size={20} className="mr-1" /> Войти в ЛК
                      </a>
                      <Link href="#" className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-black/5">
                        <ThemedIcon src="/icons/CPU.svg" size={20} className="mr-1" /> Тех. характеристики
                      </Link>
                      <a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-black/5">
                        <ThemedIcon src="/icons/Mobile.svg" size={20} className="mr-1" /> Мобильное приложение
                      </a>
                    </div>
                  )}
                </li>

                {/* Услуги */}
                <li>
                  <button
                    onClick={() => handleMobileSubmenu('services')}
                    className={`w-full text-left text-[#212121] hover:bg-black/5 px-3 py-3 rounded-xl flex items-center justify-between ${
                      isServicesActive ? 'outline outline-1 outline-[#E3E8F2]' : ''
                    }`}
                  >
                    <span>Услуги</span>
                    <svg className={`w-5 h-5 transition-transform ${openMobileSubmenu === 'services' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {openMobileSubmenu === 'services' && (
                    <div className="mt-1 ml-3 flex flex-col gap-1">
                      <Link
                        href="/services/inventory-burials"
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-black/5"
                        onClick={() => setIsMobileNavOpen(false)}
                      >
                        <ThemedIcon src="/icons/Cemetery.svg" size={20} className="mr-1" />
                        Инвентаризация мест захоронений
                      </Link>
                      <Link
                        href="/services/green-inventory"
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-black/5"
                        onClick={() => setIsMobileNavOpen(false)}
                      >
                        <ThemedIcon src="/icons/Tree.svg" size={20} className="mr-1" />
                        Инвентаризация зеленых насаждений
                      </Link>
                      <Link
                        href="/services/forest-management"
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-black/5"
                        onClick={() => setIsMobileNavOpen(false)}
                      >
                        <ThemedIcon src="/icons/Forest.svg" size={20} className="mr-1" />
                        Лесоустройство
                      </Link>

                      <Link
                        href="/services"
                        onClick={() => setIsMobileNavOpen(false)}
                        className="mt-2 bg-[#F6F7F9] text-[#212121] hover:bg-black/5 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors"
                      >
                        <ThemedIcon src="/icons/arrow_right.svg" size={18} />
                        Посмотреть все услуги
                      </Link>
                    </div>
                  )}
                </li>

                {/* Компания */}
                <li>
                  <button
                    onClick={() => handleMobileSubmenu('company')}
                    className={`w-full text-left text-[#212121] hover:bg-black/5 px-3 py-3 rounded-xl flex items-center justify-between ${
                      isCompanyActive ? 'outline outline-1 outline-[#E3E8F2]' : ''
                    }`}
                  >
                    <span>Компания</span>
                    <svg className={`w-5 h-5 transition-transform ${openMobileSubmenu === 'company' ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {openMobileSubmenu === 'company' && (
                    <div className="mt-1 ml-3 flex flex-col gap-1">
                      <Link href="/about" className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-black/5" onClick={() => setIsMobileNavOpen(false)}>
                        <ThemedIcon src="/icons/City.svg" size={20} className="mr-1" /> О компании
                      </Link>
                      <Link href="/career" className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-black/5" onClick={() => setIsMobileNavOpen(false)}>
                        <ThemedIcon src="/icons/Job.svg" size={20} className="mr-1" /> Карьера
                      </Link>
                    </div>
                  )}
                </li>

                <li>
                  <Link
                    href="/pricing"
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`block text-[#212121] hover:bg-black/5 ${isActive('/pricing') ? 'outline outline-1 outline-[#E3E8F2]' : ''} px-3 py-3 rounded-xl`}
                  >
                    Цены
                  </Link>
                </li>
                <li>
                  <Link
                    href="/documents"
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`block text-[#212121] hover:bg-black/5 ${isActive('/documents') ? 'outline outline-1 outline-[#E3E8F2]' : ''} px-3 py-3 rounded-xl`}
                  >
                    Документация
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contacts"
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`block text-[#212121] hover:bg-black/5 ${isActive('/contacts') ? 'outline outline-1 outline-[#E3E8F2]' : ''} px-3 py-3 rounded-xl`}
                  >
                    Контакты
                  </Link>
                </li>
                <li>
                  <Link
                    href="/partnership"
                    onClick={() => setIsMobileNavOpen(false)}
                    className={`block text-[#212121] hover:bg-black/5 ${isActive('/partnership') ? 'outline outline-1 outline-[#E3E8F2]' : ''} px-3 py-3 rounded-xl`}
                  >
                    Партнерство
                  </Link>
                </li>

                {/* Кнопки внизу меню */}
                <li className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      (onConsultClick ?? openConsult)();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-[#212121] border-[#00D3E6] hover:bg-[#00d3e6]/10"
                  >
                    <ThemedIcon src="/icons/icon3.svg" size={20} />
                    Консультация
                  </button>
                  <a
                    href="https://edinayasreda.ru/"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[#212121] bg-[#F6F7F9] hover:bg-black/5"
                  >
                    <ThemedIcon src="/icons/icon4.svg" size={20} />
                    Вход
                  </a>
                </li>
                <li>
                  <Button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      (onRegisterClick ?? openRegister)();
                    }}
                    variant="primary"
                    className="w-full mt-2"
                  >
                    Регистрация
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {/* ====== /ОВЕРЛЕЙ ====== */}
    </>
  );
};

export default Header;
