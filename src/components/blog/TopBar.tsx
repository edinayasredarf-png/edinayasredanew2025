'use client';

// TopBar — белый поиск (desktop) крупнее и по центру, без затемнения фона
import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { auth } from '@/lib/blogStore';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MobileSearch from './MobileSearch';

export default function TopBar() {
  const [isAuthed, setIsAuthed] = React.useState(false);
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

  React.useEffect(() => { setIsAuthed(auth.isAuthed()); }, []);
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
    <div className="sticky top-0 z-40 w-full bg-[#f2f3f7] border-b border-[#e1e2e5]">
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] h-[62px] flex items-center">
        {/* ЛОГО слева */}
        <Link
          href="/"
          className="w-[46px] h-[46px] rounded-xl overflow-hidden shrink-0"
          aria-label="Logo"
        >
          <img src="/icons/es-blue.svg" alt="logo" className="w-full h-full object-contain" />
        </Link>

        {/* ЦЕНТРАЛЬНЫЙ ПОИСК (desktop) — по центру, шире и выше */}
        <div
          ref={searchRef}
          className="hidden md:block absolute left-1/2 -translate-x-1/2 w-full max-w-[786px] px-4"
        >
          <div className="relative h-[50px]">
            <div className="absolute inset-0 bg-white rounded-xl border border-[#e1e2e5] flex items-center pl-12 pr-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') goSearch(q, contentType); }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Поиск по статьям и тегам"
                className="flex-1 outline-none text-[16px] placeholder:text-[#52555a] text-[#111] bg-transparent"
                aria-label="Поле поиска"
              />
            </div>
            <button
              type="button"
              onClick={() => goSearch(q, contentType)}
              aria-label="Найти"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-[44px] h-[44px] rounded-lg flex items-center justify-center hover:bg-black/5 transition"
            >
              <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] text-[#a4a8b2]">
                <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* выпадашка категорий — БЕЗ затемнения фона */}
          {showSearchDropdown && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl border border-[#e1e2e5] shadow-lg z-50">
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-3">Категории</div>
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
                          ? 'bg-[#2777ff] text-white'
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
            className="w-[40px] h-[40px] rounded-xl bg-white border border-[#e1e2e5] flex items-center justify-center hover:bg-gray-50"
            aria-label="Открыть поиск"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </button>

          {isAuthed ? (
            <Link
              href="/blog/new"
              className="w-[40px] h-[40px] rounded-xl bg-[#2777ff] text-white flex items-center justify-center hover:bg-[#1f66de] transition"
              aria-label="Написать"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </Link>
          ) : (
            <Link
              href="/blog/new"
              className="w-[40px] h-[40px] rounded-xl bg-[#2777ff] text-white flex items-center justify-center hover:bg-[#1f66de] transition"
              aria-label="Войти"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
              <img src="/icons/blog/podpiski.svg" alt="Профиль" className="w-5 h-5" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border shadow-lg z-50">
                <div className="p-4 border-b border-gray-100">
                  <div className="text-sm text-gray-500">Профиль</div>
                  <div className="text-lg font-semibold text-[#111]">{isAuthed ? 'Редактор' : 'Гость'}</div>
                </div>
                <div className="py-2">
                  {isAuthed ? (
                    <button
                      onClick={() => {
                        auth.logout();
                        setIsAuthed(false);
                        setShowProfileMenu(false);
                        router.refresh();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-red-600"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Выйти</span>
                    </button>
                  ) : (
                    <Link
                      href="/blog/new"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-[#111]"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Войти</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ПРАВЫЕ КНОПКИ (desktop) */}
        <div className="hidden md:flex items-center gap-3 ml-4">
          {isAuthed && (
            <Link href="/blog/new" className="h-[46px] px-3 sm:px-6 inline-flex items-center gap-2 rounded-xl bg-[#2777ff] text-white hover:bg-[#1f66de] transition">
              <span className="hidden sm:inline">Написать</span>
              <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </Link>
          )}

          {!isAuthed ? (
            <Link href="/blog/new" className="h-[46px] px-3 sm:px-6 inline-flex items-center gap-2 rounded-xl bg-[#2777ff] text-white hover:bg-[#1f66de] transition">
              <span className="hidden sm:inline">Войти</span>
              <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="h-[46px] w-[46px] rounded-xl bg-white hover:bg-gray-50 transition text-[#111] flex items-center justify-center"
                aria-haspopup="menu"
                aria-expanded={showProfileMenu}
              >
                <img src="/icons/blog/podpiski.svg" alt="Профиль" className="w-5 h-5" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border shadow-lg z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-sm text-gray-500">Профиль</div>
                    <div className="text-lg font-semibold text-[#111]">Редактор</div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        auth.logout();
                        setIsAuthed(false);
                        setShowProfileMenu(false);
                        router.refresh();
                      }}
                      className="w-full flex items之间 gap-3 px-4 py-3 hover:bg-gray-50 text-red-600"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
                ? 'bg-white border-2 border-[#2777ff] text-[#2777ff] shadow-sm'
                : 'bg-transparent border border-[#e1e2e5] text-[#52555a] hover:bg-gray-50'
            }`}
          >
            Статьи
          </Link>
          <Link
            href="/news"
            className={`h-10 rounded-xl text-sm font-medium flex items-center justify-center transition ${
              pathname === '/news'
                ? 'bg-white border-2 border-[#2777ff] text-[#2777ff] shadow-sm'
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
