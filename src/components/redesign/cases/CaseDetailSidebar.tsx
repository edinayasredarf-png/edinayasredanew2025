'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CaseItem } from '@/lib/blogStore';
import { resolveCaseCover } from '@/lib/caseCover';

type TocItem = { id: string; text: string; level: 2 | 3 };

const COLLAPSED_VISIBLE = 2;

type CaseDetailSidebarProps = {
  toc: TocItem[];
  onTocClick: (id: string) => void;
  onRequest: () => void;
  related: CaseItem[];
};

export function CaseDetailSidebar({ toc, onTocClick, onRequest, related }: CaseDetailSidebarProps) {
  const [tocExpanded, setTocExpanded] = useState(false);
  const needsCollapse = toc.length > COLLAPSED_VISIBLE;
  const isCollapsed = needsCollapse && !tocExpanded;

  const handleTocItemClick = (id: string) => {
    onTocClick(id);
    if (isCollapsed) setTocExpanded(true);
  };

  return (
    <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
      <div className="bg-white rounded-2xl px-3 py-3 md:px-4 md:py-4 overflow-hidden">
        <button
          type="button"
          onClick={() => needsCollapse && setTocExpanded((v) => !v)}
          className={`flex w-full items-center justify-between gap-2 text-left ${needsCollapse ? 'cursor-pointer' : 'cursor-default'}`}
          aria-expanded={needsCollapse ? tocExpanded : undefined}
          disabled={!needsCollapse}
        >
          <h2 className="text-xl text-[#2c2d2e] font-normal font-inter">Оглавление</h2>
          {needsCollapse && (
            <span
              className={`shrink-0 text-[#7c8a9a] transition-transform duration-200 ${tocExpanded ? 'rotate-180' : ''}`}
              aria-hidden
            >
              <ChevronIcon />
            </span>
          )}
        </button>

        {toc.length > 0 ? (
          <nav
            className={`mt-2 relative ${isCollapsed ? 'max-h-[5.25rem] overflow-hidden' : needsCollapse && tocExpanded ? 'max-h-[280px] overflow-y-auto' : ''}`}
            aria-label="Оглавление"
          >
            <ul className="space-y-0.5">
              {toc.map((item, index) => {
                if (isCollapsed && index >= COLLAPSED_VISIBLE) return null;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleTocItemClick(item.id)}
                      className={`w-full text-left px-2 py-2 rounded-lg text-base text-[#7c8a9a] hover:bg-[#f2f3f5] hover:text-[#2c2d2e] transition-colors line-clamp-2 ${
                        item.level === 3 ? 'pl-4 text-sm' : ''
                      } ${isCollapsed && index === 1 ? 'opacity-90' : ''}`}
                    >
                      {item.text}
                    </button>
                  </li>
                );
              })}
            </ul>

            {isCollapsed && (
              <>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-white/0 via-white/70 to-white"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => setTocExpanded(true)}
                  className="absolute inset-x-0 bottom-0 h-14 w-full cursor-pointer z-[1]"
                  aria-label="Показать всё оглавление"
                />
              </>
            )}
          </nav>
        ) : (
          <p className="mt-2 text-sm text-[#7c8a9a] px-0.5">Заголовки появятся в тексте кейса</p>
        )}
      </div>

      <button
        type="button"
        onClick={onRequest}
        className="w-full h-11 rounded-lg bg-[#202020] text-white text-base font-normal font-inter hover:bg-[#333] transition-colors"
      >
        Запросить похожее решение
      </button>

      {related.length > 0 && (
        <div className="bg-white rounded-2xl px-3 py-3 md:px-4 md:py-4">
          <p className="text-base text-[#2c2d2e] mb-3">Вам может быть интересно</p>
          <ul className="space-y-3">
            {related.map((item) => (
              <li key={item.id}>
                <Link href={`/cases/${item.slug}`} className="flex gap-2.5 group">
                  <div className="relative w-[121px] h-[76px] shrink-0 rounded-xl overflow-hidden bg-[#f2f3f5]">
                    <Image
                      src={resolveCaseCover(item.cover, item.contentHtml)}
                      alt=""
                      fill
                      className="object-cover object-center"
                      sizes="121px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <span className="text-[10.8px] font-medium text-[#2c2d2e] uppercase tracking-tight">
                      {item.application || 'Кейс'}
                    </span>
                    <p className="mt-1 text-xs leading-[14px] text-[#2c2d2e] line-clamp-3 group-hover:text-[#029cda] transition-colors">
                      {item.title}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 17 17" fill="none" aria-hidden>
      <path
        d="M12.49 6.21L8.5 10.2L4.51 6.21"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
