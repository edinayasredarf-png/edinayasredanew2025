'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LeftNavProps {
  activeTab?: 'feed' | 'subscriptions' | 'favorites';
  onTabChange?: (tab: 'feed' | 'subscriptions' | 'favorites') => void;
}

const BLUE = '#029cda';

function IconFeed({ active }: { active: boolean }) {
  const c = active ? BLUE : '#8c9099';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10"/>
    </svg>
  );
}

function IconFavorites({ active }: { active: boolean }) {
  const c = active ? BLUE : '#8c9099';
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? BLUE : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  );
}

function IconAbout() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c9099" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8" strokeWidth="2.5"/><line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  );
}

function IconDocs() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c9099" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>
    </svg>
  );
}

function IconSupport() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8c9099" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
}

export default function LeftNav({ activeTab = 'feed', onTabChange }: LeftNavProps) {
  const mainLinks = [
    { tab: 'feed' as const, label: 'Лента', Icon: IconFeed, href: '/blog' },
    { tab: 'favorites' as const, label: 'Избранное', Icon: IconFavorites, href: null },
  ];

  const bottomLinks = [
    { label: 'О проекте', href: '/about', Icon: IconAbout },
    { label: 'Документы', href: '/documents', Icon: IconDocs },
    { label: 'Поддержка', href: 'https://t.me/edinayasredarf', Icon: IconSupport, external: true },
  ];

  return (
    <aside className="w-[180px] shrink-0 hidden xl:block">
      <div className="sticky top-[84px] font-[Raleway]">

        {/* Основная навигация */}
        <nav className="space-y-0.5 mb-4">
          {mainLinks.map(({ tab, label, Icon, href }) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => onTabChange?.(tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors text-left
                  ${isActive
                    ? 'bg-white text-[#313131] font-semibold shadow-sm'
                    : 'text-[#52555a] hover:bg-white hover:text-[#313131]'
                  }`}
              >
                <Icon active={isActive} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Разделитель */}
        <div className="h-px bg-[#e8eaed] mb-3 mx-3" />

        {/* Нижние ссылки с иконками */}
        <div className="space-y-0.5">
          {bottomLinks.map(({ label, href, Icon, external }) =>
            external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-[#8c9099] hover:text-[#313131] hover:bg-white transition-colors"
              >
                <Icon />
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-[#8c9099] hover:text-[#313131] hover:bg-white transition-colors"
              >
                <Icon />
                {label}
              </Link>
            )
          )}
        </div>
      </div>
    </aside>
  );
}
