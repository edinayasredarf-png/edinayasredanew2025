"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';
import Footer from '@/components/Footer';
import ProductsTeamsSection from '@/components/ProductsTeamsSection';

// Специальный Layout с белым header для страницы about
const AboutLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [fixedHoverMenu, setFixedHoverMenu] = useState<string | null>(null);
  const { openConsult } = useModal();

  // Отслеживание скролла с throttling для плавности
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          setIsScrolled(scrollTop > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileSubmenu = (menu: string) => {
    setOpenMobileSubmenu(openMobileSubmenu === menu ? null : menu);
  };

  const handleMenuHover = (menu: string) => {
    setOpenMenu(menu);
  };

  const handleMenuClick = (menu: string) => {
    setFixedHoverMenu(fixedHoverMenu === menu ? null : menu);
  };

  const handleSubmenuEnter = (menu: string) => {
    setOpenMenu(menu);
  };

  const handleSubmenuLeave = () => {
    setOpenMenu(null);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col ">
      {/* Белый Header */}
      <header className={`bg-white fixed top-0 left-0 right-0  z-50 w-full transition-all duration-500 ease-out transform ${
        isScrolled
          ? 'border-b border-gray-300 backdrop-blur-lg bg-white/98'
          : 'border-b border-gray-200'
      }`}>
        <div className="max-w-[1480px] mx-auto px-4 md:px-0 ">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              {/* Десктопный логотип */}
              <Link href="/" title="ES" className="items-center hidden md:flex ">
                <Image src="/icons/es-blue.svg" alt="ES Logo Desktop" width={166} height={45} className="h-[45px] w-auto" />
              </Link>
              {/* Мобильный логотип */}
              <Link href="/" title="ES" className="items-center flex md:hidden">
                <Image src="/icons/es-blue.svg" alt="ES Logo Mobile" width={120} height={45} className="h-[45px] w-auto" />
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden lg:flex items-center gap-2 relative" onMouseLeave={handleSubmenuLeave}>
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => handleMenuHover('company')}
                    onClick={() => handleMenuClick('company')}
                    className={`transition-all duration-300 ease-out flex items-center gap-1 text-base font-medium h-20 px-4 ${fixedHoverMenu === 'company' ? 'text-[#005fcc]' : 'text-[#0077FF] hover:text-[#005fcc]'}`}
                  >
                    Компания
                    <svg className="w-4 h-4 transition-all duration-300 ease-out" style={{ transform: (openMenu === 'company' || fixedHoverMenu === 'company') ? 'rotate(180deg)' : undefined }} viewBox="0 0 17 17" fill="none"><path d="M12.4911 6.20898L8.50013 10.1999L4.50928 6.20898" stroke="currentColor" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <Link href="/cases" className="text-black hover:text-[#0077FF] transition-colors text-base font-medium h-20 px-4 flex items-center" onMouseEnter={() => setOpenMenu(null)}>Кейсы</Link>
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => handleMenuHover('platform')}
                    onClick={() => handleMenuClick('platform')}
                    className={`transition-all duration-300 ease-out flex items-center gap-1 text-base font-medium h-20 px-4 ${fixedHoverMenu === 'platform' ? 'text-[#0077FF]' : 'text-black hover:text-[#0077FF]'}`}
                  >
                    Платформа
                    <svg className="w-4 h-4 transition-all duration-300 ease-out" style={{ transform: (openMenu === 'platform' || fixedHoverMenu === 'platform') ? 'rotate(180deg)' : undefined }} viewBox="0 0 17 17" fill="none"><path d="M12.4911 6.20898L8.50013 10.1999L4.50928 6.20898" stroke="currentColor" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => handleMenuHover('services')}
                    onClick={() => handleMenuClick('services')}
                    className={`transition-all duration-300 ease-out flex items-center gap-1 text-base font-medium h-20 px-4 ${fixedHoverMenu === 'services' ? 'text-[#0077FF]' : 'text-black hover:text-[#0077FF]'}`}
                  >
                    Услуги
                    <svg className="w-4 h-4 transition-all duration-300 ease-out" style={{ transform: (openMenu === 'services' || fixedHoverMenu === 'services') ? 'rotate(180deg)' : undefined }} viewBox="0 0 17 17" fill="none"><path d="M12.4911 6.20898L8.50013 10.1999L4.50928 6.20898" stroke="currentColor" strokeWidth="1.38889" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <Link href="/pricing" className="text-black hover:text-[#0077FF] transition-colors text-base font-medium h-20 px-4 flex items-center" onMouseEnter={() => setOpenMenu(null)}>Цены</Link>
                <Link href="/documents" className="text-black hover:text-[#0077FF] transition-colors text-base font-medium h-20 px-4 flex items-center" onMouseEnter={() => setOpenMenu(null)}>Документация</Link>
                <Link href="/contacts" className="text-black hover:text-[#0077FF] transition-colors text-base font-medium h-20 px-4 flex items-center" onMouseEnter={() => setOpenMenu(null)}>Контакты</Link>
                <a href="#" className="text-black hover:text-[#0077FF] transition-colors text-base font-medium h-20 px-4 flex items-center" onMouseEnter={() => setOpenMenu(null)}>Партнерство</a>
              </nav>

              {/* Правая часть с иконками */}
              <div className="flex items-center gap-4 ml-8">
                {/* Иконка телефона */}
                <a href="tel:88005505612" className="hidden lg:flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 ease-out hover:scale-110">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </a>

                {/* Иконка заявки */}
                <button
                  onClick={openConsult}
                  className="hidden lg:flex items-center justify-center w-12 h-12 bg-[#0077FF] rounded-xl hover:bg-[#005fcc] transition-all duration-300 ease-out hover:scale-110"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>

                {/* Бургер-меню */}
                <button
                  onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                  className="lg:hidden flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 ease-out hover:scale-110"
                >
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-16 6h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Выпадающие меню с современными анимациями */}
        <div
          className={`absolute left-0 right-0 top-full bg-white/95 backdrop-blur-xl text-black shadow-2xl z-50 py-8 border-t border-gray-200 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${
            (openMenu === 'company' || fixedHoverMenu === 'company')
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }`}
          onMouseEnter={() => handleSubmenuEnter('company')}
          onMouseLeave={handleSubmenuLeave}
        >
          <div className="max-w-[1480px] mx-auto px-5">
            <div className="space-y-4">
              <a href="/career" className="flex items-center gap-3 py-3 px-8 rounded-lg hover:text-[#0077FF] transition-colors text-xl">
                <div>
                  <div className="font-medium">Карьера</div>
                  <div className="text-sm text-gray-600">Присоединяйтесь к нашей команде</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 py-3 px-8 rounded-lg hover:text-[#0077FF] transition-colors text-xl">
                <div>
                  <div className="font-medium">Партнерство</div>
                  <div className="text-sm text-gray-600">Станьте нашим партнером</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div
          className={`absolute left-0 right-0 top-full bg-white/95 backdrop-blur-xl text-black shadow-2xl z-50 py-8 border-t border-gray-200 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${
            (openMenu === 'platform' || fixedHoverMenu === 'platform')
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }`}
          onMouseEnter={() => handleSubmenuEnter('platform')}
          onMouseLeave={handleSubmenuLeave}
        >
          <div className="max-w-[1480px] mx-auto px-5">
            <div className="space-y-4">
              <a href="https://edinayasreda.ru/" className="flex items-center gap-3 py-3 px-8 rounded-lg hover:text-[#0077FF] transition-colors text-xl">
                <div>
                  <div className="font-medium">Войти в ЛК</div>
                  <div className="text-sm text-gray-600">Личный кабинет пользователя</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-3 py-3 px-8 rounded-lg hover:text-[#0077FF] transition-colors text-xl">
                <div>
                  <div className="font-medium">Тех. характеристики</div>
                  <div className="text-sm text-gray-600">Техническая документация</div>
                </div>
              </a>
              <a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" className="flex items-center gap-3 py-3 px-8 rounded-lg hover:text-[#0077FF] transition-colors text-xl">
                <div>
                  <div className="font-medium">Мобильное приложение</div>
                  <div className="text-sm text-gray-600">Скачать для Android</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div
          className={`absolute left-0 right-0 top-full bg-white/95 backdrop-blur-xl text-black shadow-2xl z-50 py-8 border-t border-gray-200 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${
            (openMenu === 'services' || fixedHoverMenu === 'services')
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'
          }`}
          onMouseEnter={() => handleSubmenuEnter('services')}
          onMouseLeave={handleSubmenuLeave}
        >
          <div className="max-w-[1480px] mx-auto px-5">
            <div className="space-y-4">
              <Link href="/services/inventory-burials" className="flex items-center gap-3 py-3 px-8 rounded-lg hover:text-[#0077FF] transition-colors text-xl">
                <div>
                  <div className="font-medium">Инвентаризация мест захоронений</div>
                  <div className="text-sm text-gray-600">Учет и мониторинг кладбищ</div>
                </div>
              </Link>
              <Link href="/services/green-inventory" className="flex items-center gap-3 py-3 px-8 rounded-lg hover:text-[#0077FF] transition-colors text-xl">
                <div>
                  <div className="font-medium">Инвентаризация зеленых насаждений</div>
                  <div className="text-sm text-gray-600">Учет деревьев и кустарников</div>
                </div>
              </Link>
              <Link href="/services/forest-management" className="flex items-center gap-3 py-3 px-8 rounded-lg hover:text-[#0077FF] transition-colors text-xl">
                <div>
                  <div className="font-medium">Лесоустройство</div>
                  <div className="text-sm text-gray-600">Планирование лесного хозяйства</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Мобильное меню с плавными анимациями */}
      <div
        className={`fixed top-20 left-0 right-0 bg-white/98 backdrop-blur-xl z-50 shadow-2xl border-b border-gray-200 transition-all duration-200 ease-out transform ${
          isMobileNavOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-99 pointer-events-none'
        }`}
      >
        <div className="max-w-[1480px] mx-auto px-5">
          <nav className="py-4 space-y-2">
            {/* Компания */}
            <div className="relative">
              <button
                onClick={() => handleMobileSubmenu('company')}
                className="w-full flex items-center justify-between py-3 text-[#0077FF] font-medium text-lg"
              >
                <span>Компания</span>
                <svg className={`w-5 h-5 transition-transform duration-200 ease-out ${openMobileSubmenu === 'company' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMobileSubmenu === 'company' && (
                <div className="ml-4 space-y-2 mt-2 transition-all duration-200 ease-out transform opacity-100 translate-y-0">
                  <a href="/career" className="flex items-center gap-3 py-2 text-black hover:text-[#0077FF] transition-colors">
                    Карьера
                  </a>
                  <a href="#" className="flex items-center gap-3 py-2 text-black hover:text-[#0077FF] transition-colors">
                    Партнерство
                  </a>
                </div>
              )}
            </div>

            {/* Кейсы */}
            <Link href="/cases" className="block py-3 text-black hover:text-[#0077FF] transition-colors text-lg font-medium">Кейсы</Link>

            {/* Платформа */}
            <div className="relative">
              <button
                onClick={() => handleMobileSubmenu('platform')}
                className="w-full flex items-center justify-between py-3 text-black font-medium text-lg"
              >
                <span>Платформа</span>
                <svg className={`w-5 h-5 transition-transform duration-200 ease-out ${openMobileSubmenu === 'platform' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMobileSubmenu === 'platform' && (
                <div className="ml-4 space-y-2 mt-2 transition-all duration-200 ease-out transform opacity-100 translate-y-0">
                  <a href="https://edinayasreda.ru/" className="flex items-center gap-3 py-2 text-black hover:text-[#0077FF] transition-colors">
                    Войти в ЛК
                  </a>
                  <a href="#" className="flex items-center gap-3 py-2 text-black hover:text-[#0077FF] transition-colors">
                    Тех. характеристики
                  </a>
                  <a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" className="flex items-center gap-3 py-2 text-black hover:text-[#0077FF] transition-colors">
                    Мобильное приложение
                  </a>
                </div>
              )}
            </div>

            {/* Услуги */}
            <div className="relative">
              <button
                onClick={() => handleMobileSubmenu('services')}
                className="w-full flex items-center justify-between py-3 text-black font-medium text-lg"
              >
                <span>Услуги</span>
                <svg className={`w-5 h-5 transition-transform duration-200 ease-out ${openMobileSubmenu === 'services' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openMobileSubmenu === 'services' && (
                <div className="ml-4 space-y-2 mt-2 transition-all duration-200 ease-out transform opacity-100 translate-y-0">
                  <Link href="/services/inventory-burials" className="flex items-center gap-3 py-2 text-black hover:text-[#0077FF] transition-colors">
                    Инвентаризация мест захоронений
                  </Link>
                  <Link href="/services/green-inventory" className="flex items-center gap-3 py-2 text-black hover:text-[#0077FF] transition-colors">
                    Инвентаризация зеленых насаждений
                  </Link>
                  <Link href="/services/forest-management" className="flex items-center gap-3 py-2 text-black hover:text-[#0077FF] transition-colors">
                    Лесоустройство
                  </Link>
                </div>
              )}
            </div>

            <Link href="/pricing" className="block py-3 text-black hover:text-[#0077FF] transition-colors text-lg font-medium">Цены</Link>
            <Link href="/documents" className="block py-3 text-black hover:text-[#0077FF] transition-colors text-lg font-medium">Документация</Link>
            <Link href="/contacts" className="block py-3 text-black hover:text-[#0077FF] transition-colors text-lg font-medium">Контакты</Link>
            <a href="#" className="block py-3 text-black hover:text-[#0077FF] transition-colors text-lg font-medium">Партнерство</a>

            {/* Мобильные иконки */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 mt-4">
              <a href="tel:88005505612" className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  openConsult();
                }}
                className="flex items-center justify-center w-12 h-12 bg-[#0077FF] rounded-xl hover:bg-[#005fcc] transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default function AboutPage() {
  const [statsImageIndex, setStatsImageIndex] = useState(0);

  // Массив изображений для блока статистики
  const statsImages = [
    "/img/team/1.jpg",
    "/img/team/1.2.jpg",
    "/img/team/1.3.jpg",
    "/img/team/1.4.jpg",
    "/img/team/1.5.jpg",
		"/img/team/1.6.jpg",
    "/img/team/1.7.jpg",
    "/img/team/1.8.jpg",
		"/img/team/1.9.jpg"

  ];

  // Автоматическая смена изображений в блоке статистики
  useEffect(() => {
    const statsImageInterval = setInterval(() => {
      setStatsImageIndex((prev) => (prev + 1) % statsImages.length);
    }, 3000); // Смена каждые 3 секунды

    return () => clearInterval(statsImageInterval);
  }, [statsImages.length]);

  // Убрал неиспользуемые переменные companyStats и achievements

	const historyItems = [
		{
			year: "2011",
			description: "Создание компании Экострой"
		},
		{
			year: "2013",
			description: "Выход на рынок закупок"
		},
		{
			year: "2014",
			description: "Закрыли первый крупный контракт"
		},
		{
			year: "2019",
			description: "Создали сервис Единая Среда"
		},
		{
			year: "2022",
			description: "Открытие АНО Область Развития"
		},
		{
			year: "2024",
			description: "Создание сервиса MyRoots"
		}
	];

  return (
    <AboutLayout>
      <div className="pt-20">
            {/* Hero Section */}
      <section className="bg-[#0077FF] text-white relative overflow-hidden min-h-[200px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20 order-1 lg:order-1">
              <h1 className="text-5xl sm:text-6xl md:text-[98px] font-medium leading-tight">
               Что такое ЕС
              </h1>
              <p className="mt-8 text-xl sm:text-[27px] text-white/90 max-w-2xl">
                Развиваем сервисы, которые помогают муниципалитетам решать повседневные задачи управления территориями и экологическими процессами
              </p>
            </div>
            <div className="hidden lg:flex flex-1 w-full h-full relative justify-end items-center z-10 order-2 lg:order-2">
              <Image
                src="/icons/toogle1.svg"
                alt="Единая Среда"
                width={300}
                height={200}
                className="w-full max-w-[100px] lg:max-w-[120px] h-auto object-contain"
                priority
                style={{ height: 'auto' }}
              />
            </div>
          </div>
        </div>
      </section>

            {/* Numbers Section */}
      <section className="py-20 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-medium text-gray-900 text-left">
            Цифры говорят за нас
          </h2>
        </div>
      </section>

      {/* Statistics Row - Full Width */}
      <section className="bg-gray-100 w-full py-2 px-4 md:px-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-0">
            <div className="py-10 text-left border-b md:border-b-0 md:border-r border-gray-300">
              <div className="text-6xl md:text-7xl font-bold text-gray-900 mb-3">40+</div>
              <div className="text-xl text-gray-700">регионов РФ уже пользуются сервисом</div>
            </div>
            <div className="py-10 text-left border-b md:border-b-0 md:border-r border-gray-300">
              <div className="text-6xl md:text-7xl font-bold text-gray-900 mb-3">500+</div>
              <div className="text-xl text-gray-700">реализованных проектов</div>
            </div>
            <div className="py-10 text-left">
              <div className="text-6xl md:text-7xl font-bold text-gray-900 mb-3">100M+</div>
              <div className="text-xl text-gray-700">инвентаризированных деревьев</div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Information Row */}
      <section className="py-20 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="py-10 text-left border-b md:border-b-0 md:pr-8 md:border-r border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Проекты и сервисы</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Единая Среда объединяет экологический мониторинг, управление муниципальной собственностью и цифровизацию городских процессов в единую платформу для эффективного управления территориями.
              </p>
            </div>
            <div className="py-10 text-left border-b md:border-b-0 md:px-8 md:border-r border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Платформа</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Пользователи могут работать с единой учетной записью, использовать ГИС-инструменты, анализировать экологические данные и управлять муниципальными ресурсами через единую цифровую среду.
              </p>
            </div>
            <div className="py-10 text-left md:pl-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Для муниципалитетов</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Для муниципалитетов мы развиваем продукты и услуги для цифровизации экологических процессов — от инвентаризации зеленых насаждений до комплексного управления городской средой.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects and Services Statistics - согласно Figma */}
			<section className="pt-4 pb-20 bg-white">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="w-full mx-auto">


      {/* Основная сетка статистики */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-0 border-t border-gray-200">
        {/* Единая Среда */}
        <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="flex justify-between items-center mb-6 px-6">
            <h3 className="text-xl font-medium text-black leading-loose">
              Единая Среда
            </h3>
            <div className="w-[42px] h-[42px]  rounded-lg flex items-center justify-center">
            <img
                src="/icons/es-blue.svg"
                alt="Единая Среда"
                className="w-full max-w-[500px] object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>

          <div className="space-y-6 px-6">
            <div>
              <div className="text-[64px] font-medium text-black leading-[71.68px]">
                {">"}200
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                компаний ежемесячно пользуются платформой
              </p>
            </div>

            <div>
              <div className="text-[64px] font-medium text-black leading-[71.68px]">
                2000
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                паспортов создано пользователями
              </p>
            </div>

            <div>
              <div className="flex items-baseline">
                <span className="text-[64px] font-medium text-black leading-[71.68px]">
                  10
                </span>
                <span className="text-[38px] font-medium text-black leading-[42.56px] ml-2">
                  млн
                </span>
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                просмотров в сутки
              </p>
            </div>
          </div>
        </div>

        {/* MyRoots */}
        <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="flex justify-between items-center mb-6 px-6">
            <h3 className="text-xl font-medium text-black leading-loose">
              MyRoots
            </h3>
            <div className="w-[42px] h-[42px]  rounded-lg flex items-center justify-center">
            <img
                src="/icons/myroots.svg"
                alt="MyRoots"
                className="w-full max-w-[500px] object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>

          <div className="space-y-6 px-6">
            <div>
              <div className="flex items-baseline">
                <span className="text-[64px] font-medium text-black leading-[71.68px]">
                  20
                </span>
                <span className="text-[38px] font-medium text-black leading-[42.56px] ml-2">
                  тыс
                </span>
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                 генеалогических деревьев создано пользователями
              </p>
            </div>

            <div>
              <div className="text-[64px] font-medium text-black leading-[71.68px]">
                {">"}1300
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                услуг по уходу за могилами оказано
              </p>
            </div>

            <div>
              <div className="text-[64px] font-medium text-black leading-[71.68px]">
                12 семей
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                нашли своих родственников
              </p>
            </div>
          </div>
        </div>

        {/* Область Развития */}
        <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="flex justify-between items-center mb-6 px-6">
            <h3 className="text-xl font-medium text-black leading-loose">
              Область Развития
            </h3>
						<div className="w-[64px] h-[42px]  rounded-lg flex items-center justify-center">
            <img
                src="/icons/oblastrazvitia.svg"
                alt="Область Развития"
                className="w-full max-w-[500px] object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>

          <div className="space-y-6 px-6">
            <div>
              <div className="text-[64px] font-medium text-black leading-[71.68px]">
                12
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                субботников организовано <br /> и проведено
              </p>
            </div>

            <div>
              <div className="text-[64px] font-medium text-black leading-[71.68px]">
                2
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                детских площадки построено
              </p>
            </div>

            <div>
              <div className="text-[64px] font-medium text-black leading-[71.68px]">
                2
              </div>
              <p className="text-base font-normal text-black leading-normal mt-1">
                инвестора привлечено
              </p>
            </div>
          </div>
        </div>

        {/* Блок с изображением */}
        <div className="relative bg-[#0077FF] p-2 overflow-hidden">
          <div className="relative h-full flex flex-col">
            {/* Сменяющиеся изображения */}
            <div className="relative flex-1  overflow-hidden rounded-lg">
              <Image
                src={statsImages[statsImageIndex]}
                alt="Наша команда"
                fill
                className="object-cover transition-all duration-500"
              />
            </div>

            {/* Индикаторы слайдов */}

          </div>
        </div>
      </div>

      {/* Нижняя секция с услугами */}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-0 border-b border-gray-200 border-t border-gray-200">
        {/* Инвентаризация зеленых насаждений */}
        <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="mb-4 px-6">
            <h3 className="text-xl font-normal text-black leading-loose">
              Инвентаризация зеленых насаждений
            </h3>
          </div>

          <div className="px-6">
            <div className="flex items-baseline">
              <span className="text-[64px] font-medium text-black leading-[71.68px]">
                7
              </span>
              <span className="text-[38px] font-medium text-black leading-[42.56px] ml-2">
                млн
              </span>
            </div>
            <p className="text-base font-normal text-black leading-normal mt-1">
              деревьев за 2025 год
            </p>
          </div>
        </div>

        {/* Инвентаризация мест захоронений */}
        <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="mb-4 px-6">
            <h3 className="text-xl font-normal text-black leading-loose">
              Инвентаризация мест захоронений
            </h3>
          </div>

          <div className="px-6">
            <div className="flex items-baseline">
              <span className="text-[64px] font-medium text-black leading-[71.68px]">
                5
              </span>
              <span className="text-[38px] font-medium text-black leading-[42.56px] ml-2">
                млн
              </span>
            </div>
            <p className="text-base font-normal text-black leading-normal mt-1">
              мест захоронений за 2025 год
            </p>
          </div>
        </div>

        {/* Лесоустройство */}
        <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="mb-4 px-6">
            <h3 className="text-xl font-normal text-black leading-loose">
              Лесоустройство <br /><br />
            </h3>
          </div>

          <div className="px-6">
            <div className="flex items-baseline">
              <span className="text-[64px] font-medium text-black leading-[71.68px]">
                2,7
              </span>
              <span className="text-[38px] font-medium text-black leading-[42.56px] ml-2">
                млн
              </span>
            </div>
            <p className="text-base font-normal text-black leading-normal mt-1">
              га лесов проинвентаризировано
            </p>
          </div>
        </div>

        {/* Кнопка заказа услуг */}
        <div className="flex items-center justify-center py-8">
          <button className="px-6 py-3 border border-[#050b15] text-black rounded-lg hover:bg-[#2777ff] hover:text-white transition-all duration-300 flex items-center">
            <span className="mr-2 text-base">Заказать услуги</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</section>


<ProductsTeamsSection />


      {/* History */}
			<section className="py-8 md:py-12 bg-[#0077FF] text-white">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="w-auto mx-auto">
      {/* Заголовки с левым выравниванием */}
      <div className="mb-2 md:mb-4 text-left">
        <h2 className="text-4xl md:text-6xl lg:text-[98px] font-medium leading-tight ">
          История
        </h2>
        <p className="text-xl md:text-2xl max-w-3xl">
          Основные даты в жизни компании
        </p>
      </div>

      <div className="pt-10 md:pt-16">
        {/* Десктоп-версия */}
        <div className="hidden md:flex justify-between relative">
          {historyItems.map((item, index) => (
            <div
              key={index}
              className="relative flex flex-col w-full px-2"
              style={{ maxWidth: `${100/historyItems.length}%` }}
            >
              <div className="text-left w-full">
                <div className="text-3xl md:text-4xl font-bold mb-4">{item.year}</div>
                <p className="text-base">{item.description}</p>
              </div>

              {/* Стрелка между элементами */}
              {index < historyItems.length - 1 && (
                <div className="absolute top-2/8 right-4 transform translate-x-1/20 -translate-y-2/3">
                   <img
                src="/icons/arrow.svg"
                alt="Единая Среда"
                className="w-full max-w-[500px] object-contain"
                style={{ height: 'auto' }}
              />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Мобильная версия */}
        <div className="md:hidden space-y-8">
          {historyItems.map((item, index) => (
            <div key={index} className="pb-8">
              <div className="flex">
                <div className="text-3xl font-bold mr-4 min-w-[80px]">{item.year}</div>
                <p className="text-base flex-1">{item.description}</p>
              </div>

              {/* Разделительная линия */}
              {index < historyItems.length - 1 && (
                <div className="h-px bg-white/30 mt-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>
      </div>
    </AboutLayout>
  );
}