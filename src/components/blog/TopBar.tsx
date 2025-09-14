'use client';

import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { auth } from '@/lib/blogStore';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MobileSearch from './MobileSearch';

export default function TopBar() {
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showMobileSearch, setShowMobileSearch] = React.useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = React.useState(false);
  const [contentType, setContentType] = React.useState<'all' | 'post' | 'news' | 'lesson' | 'case'>('all');
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qFromUrl = sp.get('q') || '';
  const [q, setQ] = React.useState(qFromUrl);

  React.useEffect(() => { setIsAuthed(auth.isAuthed()); }, []);

  // Закрытие меню при клике вне его
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  React.useEffect(() => { setQ(qFromUrl); }, [qFromUrl]);

  const goSearch = (value: string, type?: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set('q', value); else params.delete('q');
    if (type && type !== 'all') params.set('type', type); else params.delete('type');
    router.push(`${pathname}?${params.toString()}`);
    setShowSearchDropdown(false);
  };

  const handleSearchClick = () => {
    setShowSearchDropdown(true);
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-[#f2f3f7] border-b border-[#e1e2e5]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] h-[62px] flex items-center justify-between">
        <Link href="/" className="w-[46px] h-[46px] rounded-xl overflow-hidden shrink-0" aria-label="Logo">
          <img src="/icons/es-blue.svg" alt="logo" className="w-full h-full object-contain" />
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:block flex-1 max-w-[400px] mx-6 relative" ref={searchRef}>
          <div className="h-[46px] relative">
            <div className="absolute inset-0 bg-white rounded-xl border border-[#e1e2e5] flex items-center pl-12 pr-3">
            <input
                value={q}
                onChange={(e) => { setQ(e.target.value); }}
                onKeyDown={(e) => { if (e.key === 'Enter') goSearch(q, contentType); }}
                onClick={handleSearchClick}
                placeholder="Поиск по статьям и тегам"
                className="flex-1 outline-none text-[15px] placeholder:text-[#52555a] text-[#111]"
              />
              <button
                onClick={() => goSearch(q, contentType)}
                className="w-[42px] h-[42px] rounded-lg flex items-center justify-center hover:bg-[#f2f3f7]"
              >
                <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] text-[#a4a8b2]">
                  <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-lg flex items-center justify-center hover:bg-[#f2f3f7]"
            >
              <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] text-[#a4a8b2]">
                <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Search Dropdown */}
          {showSearchDropdown && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black bg-opacity-20 z-40" onClick={() => setShowSearchDropdown(false)} />
              
              {/* Dropdown Content */}
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#e1e2e5] shadow-lg z-50">
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-3">Категории</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setContentType('all'); goSearch(q, 'all'); }}
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        contentType === 'all' 
                          ? 'bg-[#2777ff] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Все
                    </button>
                    <button
                      onClick={() => { setContentType('post'); goSearch(q, 'post'); }}
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        contentType === 'post' 
                          ? 'bg-[#2777ff] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Статьи
                    </button>
                    <button
                      onClick={() => { setContentType('news'); goSearch(q, 'news'); }}
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        contentType === 'news' 
                          ? 'bg-[#2777ff] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Новости
                    </button>
                    <button
                      onClick={() => { setContentType('lesson'); goSearch(q, 'lesson'); }}
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        contentType === 'lesson' 
                          ? 'bg-[#2777ff] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Уроки
                    </button>
                    <button
                      onClick={() => { setContentType('case'); goSearch(q, 'case'); }}
                      className={`px-3 py-2 text-sm rounded-lg transition ${
                        contentType === 'case' 
                          ? 'bg-[#2777ff] text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Кейсы
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Spacer for centering buttons */}
        <div className="flex-1"></div>

        {/* Mobile search button */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden w-[46px] h-[46px] rounded-xl bg-white border border-[#e1e2e5] flex items-center justify-center hover:bg-gray-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Buttons container with proper spacing */}
        <div className="flex items-center gap-3">
          {/* Write button - only show after login */}
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
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-[#111]"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Админ панель</span>
                  </Link>
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
                </div>
              </div>
            )}
            </div>
          )}
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

    </div>

      {/* Mobile Search Modal */}
      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        initialQuery={q}
      />
    </div>
  );
}
