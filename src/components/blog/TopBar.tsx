'use client';

// TopBar — белый поиск (desktop) крупнее и по центру, без затемнения фона
import Link from 'next/link';
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { authStore } from '@/lib/authStore';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MobileSearch from './MobileSearch';

export default function TopBar() {
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [isEditor, setIsEditor] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [contentType, setContentType] = useState<'all' | 'post' | 'news' | 'lesson' | 'case'>('all');

  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qFromUrl = sp.get('q') || '';
  const [q, setQ] = useState(qFromUrl);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      const isAuth = authStore.isAuthenticated();
      const isEdit = authStore.canWriteArticles();
      console.log('TopBar auth state update:', { isAuth, isEdit });
      setIsAuthed(isAuth);
      setIsEditor(isEdit);
    });

    // Устанавливаем начальное состояние
    const isAuth = authStore.isAuthenticated();
    const isEdit = authStore.canWriteArticles();
    console.log('TopBar initial auth state:', { isAuth, isEdit });
    setIsAuthed(isAuth);
    setIsEditor(isEdit);

    return unsubscribe;
  }, []);
  React.useEffect(() => { setQ(qFromUrl); }, [qFromUrl]);

  // закрытие поповеров
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const goSearch = (value: string, type?: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set('q', value); else params.delete('q');
    if (type && type !== 'all') params.set('type', type); else params.delete('type');
    router.push(`${pathname}?${params.toString()}`);
    setShowSearchDropdown(false);
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-[#f2f3f7] font-raleway font-medium pt-2">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] h-[62px] flex items-center">
        {/* ЛОГО слева */}
        <Link
          href="/"
          className="w-[46px] h-[46px] rounded-xl overflow-hidden shrink-0"
          aria-label="Logo"
        >
          <Image src="/icons/es-blue.svg" alt="logo" width={46} height={46} className="w-full h-full object-contain" />
        </Link>

        {/* ЦЕНТРАЛЬНЫЙ ПОИСК (desktop) — по центру, шире и выше */}
        <div
          ref={searchRef}
          className="hidden md:block absolute left-1/2 -translate-x-1/2 w-full max-w-[764px] "
        >
          <div className="relative h-[50px]">
            <div className="absolute inset-0 bg-white rounded-2xl flex items-center pl-12 pr-4">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') goSearch(q, contentType); }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Поиск по статьям и тегам"
                className="flex-1 outline-none text-[16px] placeholder:text-[#52555a] text-[#313131] bg-transparent"
                aria-label="Поле поиска"
              />
            </div>
            <button
              type="button"
              onClick={() => goSearch(q, contentType)}
              aria-label="Найти"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-[44px] h-[44px] rounded-lg flex items-center justify-center hover:bg-black/5 transition"
            >
              	<Image
          src="/icons/search.svg"
          alt="Поиск"
          width={20}
          height={20}
          className="object-contain"
        />
            </button>
          </div>

          {/* выпадашка категорий — БЕЗ затемнения фона */}
          {showSearchDropdown && (
            <div className="absolute top-full left-1 right-0 mt-6 bg-white rounded-2xl shadow-2xl ">
              <div className="p-4">
                <div className="text-sm text-[#7C8A9A] font-medium mb-3">Категории</div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['all','Все'],
                    ['post','Статьи'],
                    ['news','Новости'],
                    ['lesson','Уроки'],
                    ['case','Кейсы'],
                  ] as const).map(([key,label])=>(
                    <button
                      key={key}
                      onClick={() => { setContentType(key as any); goSearch(q, key); }}
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        contentType === key
                          ? 'bg-[#029cda] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* растяжка */}
        <div className="flex-1" />

        {/* МОБИЛЬНЫЕ ДЕЙСТВИЯ */}
        <div className="md:hidden ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowMobileSearch(true)}
            className="w-[40px] h-[40px] rounded-xl bg-white flex items-center justify-center hover:bg-gray-50"
            aria-label="Открыть поиск"
          >
            	<Image
          src="/icons/search.svg"
          alt="Все новости"
          width={20}
          height={20}
          className="object-contain"
        />
          </button>

          {isEditor ? (
            <Link
              href="/blog/new"
              className="w-[40px] h-[40px] rounded-xl bg-[#029cda] text-white flex items-center justify-center hover:bg-[#029cda]/90 transition"
              aria-label="Написать"
            >
	<Image
          src="/icons/plus.svg"
          alt="Написать"
          width={20}
          height={20}
          className="object-contain"
        />            </Link>
          ) : !isAuthed ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
              className="w-[40px] h-[40px] rounded-xl bg-[#029cda] text-white flex items-center justify-center hover:bg-[#1f66de] transition"

              aria-label="Войти"
            ><Image
						src="/icons/sing_in.svg"
						alt="Войти в  профиль"
						width={20}
						height={20}
						className="object-contain"
					/>

            </button>
          ) : (
            <Link
              href="/profile"
              className="w-[40px] h-[40px] rounded-xl bg-[#029cda] text-white flex items-center justify-center hover:bg-[#1f66de] transition"
              aria-label="Профиль"
            >
           	<Image
          src="/icons/profile.svg"
          alt="Ваш профиль"
          width={20}
          height={20}
          className="object-contain"
        />
            </Link>
          )}

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu((v)=>!v)}
              className="w-[40px] h-[40px] rounded-xl bg-white border border-[#e1e2e5] flex items-center justify-center hover:bg-gray-50"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              aria-label="Меню профиля"
            >
              <Image src="/icons/blog/podpiski.svg" alt="Профиль" width={20} height={20} className="w-5 h-5" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl ">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm text-gray-500">Профиль</div>
                  <div className="text-lg font-semibold text-[#313131]">
                    {isEditor ? 'Редактор' : isAuthed ? 'Пользователь' : 'Гость'}
                  </div>
                </div>
                <div className="py-2">
                  {isAuthed ? (
                    <>
                    {isEditor && (
                      <Link
                        href="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-[#313131]"
                      >
                      	<Image
          src="/icons/admin.svg"
          alt="Админ панель"
          width={20}
          height={20}
          className="object-contain"
        />
                        <span>Админ-панель</span>
                      </Link>
                    )}
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-[#313131]"
                    >
                    	<Image
          src="/icons/profile.svg"
          alt="Личный кабинет"
          width={20}
          height={20}
          className="object-contain"
        />
                      <span>Личный кабинет</span>
                    </Link>
                      <button
                        onClick={() => {
                          authStore.signOut();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-red-600"
                      >
                       	<Image
          src="/icons/sign_out.svg"
          alt="Выйти из профиля"
          width={20}
          height={20}
          className="object-contain"
        />
                        <span>Выйти</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        window.dispatchEvent(new CustomEvent('openAuthModal'));
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-[#313131]"
                    >
	<Image
          src="/icons/sign_in.svg"
          alt="Войти в профиль"
          width={20}
          height={20}
          className="object-contain"
        />
                      <span>Войти</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ПРАВЫЕ КНОПКИ (desktop) */}
        <div className="hidden md:flex items-center gap-3 ml-4">
          {isEditor && (
            <Link href="/blog/new" className="h-[46px] px-3 sm:px-6 inline-flex items-center gap-2 rounded-xl bg-[#029cda] text-white hover:bg-[#1f66de] transition">
              <span className="hidden sm:inline">Написать</span>
              	<Image
          src="/icons/plus.svg"
          alt="Все новости"
          width={20}
          height={20}
          className="object-contain"
        />
            </Link>
          )}

          {!isAuthed ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
              className="h-[46px] px-3 sm:px-6 inline-flex items-center gap-2 rounded-xl bg-[#029cda] text-white hover:bg-[#1f66de] transition"
            >
              <span className="hidden sm:inline">Войти</span>
							<Image
						src="/icons/sing_in.svg"
						alt="Войти в  профиль"
						width={20}
						height={20}
						className="object-contain"
					/>
            </button>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="h-[46px] w-[46px] rounded-xl bg-white hover:bg-gray-50 transition text-[#313131] flex items-center justify-center"
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
              >
                <Image src="/icons/blog/podpiski.svg" alt="Профиль" width={20} height={20} className="w-5 h-5" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border shadow-lg z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-sm text-gray-500">Профиль</div>
                    <div className="text-lg font-semibold text-[#313131]">
                      {isEditor ? 'Редактор' : 'Пользователь'}
                    </div>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-[#313131]"
                    >
                      	<Image
          src="/icons/admin.svg"
          alt="Админ панель"
          width={14}
          height={14}
          className="object-contain"
        />
                      <span>Админ-панель</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-[#313131]"
                    >
                   	<Image
          src="/icons/profile.svg"
          alt="Личный кабинет"
          width={20}
          height={20}
          className="object-contain"
        />
                      <span>Личный кабинет</span>
                    </Link>
                    <button
                      onClick={() => {
                        authStore.signOut();
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-red-600"
                    >
                  	<Image
          src="/icons/sign_out.svg"
          alt="Выйти из профиля "
          width={20}
          height={20}
          className="object-contain"
        />
                      <span>Выйти</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* мобильные вкладки */}
      <div className="md:hidden max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] pb-3">
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/blog"
            className={`h-10 rounded-xl text-sm font-medium flex items-center justify-center transition ${
              pathname === '/blog'
                ? 'bg-white border-2 border-[#029cda] text-[#029cda] shadow-sm'
                : 'bg-transparent border border-[#e1e2e5] text-[#52555a] hover:bg-gray-50'
            }`}
          >
            Статьи
          </Link>
          <Link
            href="/news"
            className={`h-10 rounded-xl text-sm font-medium flex items-center justify-center transition ${
              pathname === '/news'
                ? 'bg-white border-2 border-[#029cda] text-[#029cda] shadow-sm'
                : 'bg-transparent border border-[#e1e2e5] text-[#52555a] hover:bg-gray-50'
            }`}
          >
            Новости
          </Link>
        </div>
      </div>

      {/* мобильный полноэкранный поиск */}
      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        initialQuery={q}
      />
    </div>
  );
}
