'use client';

import Link from 'next/link';
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { authStore } from '@/lib/authStore';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MobileSearch from './MobileSearch';

export default function TopBar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const qFromUrl = sp.get('q') || '';
  const [q, setQ] = useState(qFromUrl);

  useEffect(() => {
    const unsub = authStore.subscribe(() => {
      setIsAuthed(authStore.isAuthenticated());
      setIsEditor(authStore.canWriteArticles());
      setIsAdmin(authStore.isAdmin());
    });
    setIsAuthed(authStore.isAuthenticated());
    setIsEditor(authStore.canWriteArticles());
    setIsAdmin(authStore.isAdmin());
    return unsub;
  }, []);

  useEffect(() => { setQ(qFromUrl); }, [qFromUrl]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const goSearch = (value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set('q', value); else params.delete('q');
    router.push(`${pathname}?${params.toString()}`);
    setShowSearchInput(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#e8eaed] font-[Raleway]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[70px] flex items-center gap-4">

        {/* Логотип — как на всех страницах */}
        <Link href="/" className="shrink-0" aria-label="Главная">
          <Image src="/img/logo_dark.svg" alt="Единая среда" width={166} height={45} className="h-[45px] w-auto object-contain" />
        </Link>

        <div className="flex-1" />

        {/* Поиск (desktop — inline input) */}
        <div className="hidden md:flex items-center">
          {showSearchInput ? (
            <div className="flex items-center gap-2 bg-[#f5f6f8] rounded-xl px-3 h-9 w-[220px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c9099" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={searchInputRef}
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') goSearch(q); if (e.key === 'Escape') setShowSearchInput(false); }}
                onBlur={() => { if (!q) setShowSearchInput(false); }}
                placeholder="Поиск по статьям…"
                className="flex-1 bg-transparent text-[13px] text-[#313131] placeholder:text-[#8c9099] outline-none"
              />
              {q && (
                <button onClick={() => { setQ(''); goSearch(''); }} className="text-[#8c9099] hover:text-[#313131]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSearchInput(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#52555a] hover:bg-[#f5f6f8] transition-colors"
              aria-label="Поиск"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          )}
        </div>

        {/* Написать (для редакторов) */}
        {isEditor && (
          <Link
            href="/blog/new"
            className="hidden md:flex items-center gap-2 h-9 px-4 rounded-xl bg-[#029cda] text-white text-[14px] font-semibold hover:bg-[#0280b5] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Написать
          </Link>
        )}

        {/* Профиль / Войти */}
        {!isAuthed ? (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
            className="hidden md:flex items-center gap-2 h-9 px-4 rounded-xl border border-[#e8eaed] text-[#313131] text-[14px] font-medium hover:bg-[#f5f6f8] transition-colors"
          >
            Войти
          </button>
        ) : (
          <div className="hidden md:block relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(v => !v)}
              className="w-9 h-9 rounded-xl bg-[#e6f6fc] flex items-center justify-center text-[#029cda] font-bold text-[15px] hover:bg-[#cceefb] transition-colors"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
            >
              П
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#e8eaed] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#f0f1f3]">
                  <div className="text-[12px] text-[#8c9099]">Профиль</div>
                  <div className="text-[14px] font-semibold text-[#313131]">
                    {isEditor ? 'Редактор' : 'Пользователь'}
                  </div>
                </div>
                <div className="py-1.5">
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-[#313131] text-[14px]">
                      <Image src="/icons/admin.svg" alt="" width={16} height={16} />
                      Админ-панель
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-[#313131] text-[14px]">
                    <Image src="/icons/profile.svg" alt="" width={16} height={16} />
                    Личный кабинет
                  </Link>
                  <button onClick={async () => { await authStore.signOut(); window.location.reload(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-red-500 text-[14px]">
                    <Image src="/icons/sign_out.svg" alt="" width={16} height={16} />
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Мобильные кнопки ── */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setShowMobileSearch(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#52555a] hover:bg-[#f5f6f8]"
            aria-label="Поиск"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {!isAuthed ? (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
              className="h-9 px-3 rounded-xl bg-[#029cda] text-white text-[13px] font-semibold hover:bg-[#0280b5]"
            >
              Войти
            </button>
          ) : (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(v => !v)}
                className="w-9 h-9 rounded-xl bg-[#e6f6fc] flex items-center justify-center text-[#029cda] font-bold"
              >
                П
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#e8eaed] z-50 overflow-hidden">
                  <div className="py-1.5">
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-[#313131] text-[14px]">
                        <Image src="/icons/admin.svg" alt="" width={16} height={16} />
                        Админ-панель
                      </Link>
                    )}
                    {isEditor && (
                      <Link href="/blog/new" onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-[#313131] text-[14px]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Написать
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-[#313131] text-[14px]">
                      <Image src="/icons/profile.svg" alt="" width={16} height={16} />
                      Личный кабинет
                    </Link>
                    <button onClick={async () => { await authStore.signOut(); window.location.reload(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f5f6f8] text-red-500 text-[14px]">
                      <Image src="/icons/sign_out.svg" alt="" width={16} height={16} />
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MobileSearch
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        initialQuery={q}
      />
    </header>
  );
}
