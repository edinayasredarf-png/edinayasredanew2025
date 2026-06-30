'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface LeftNavProps {
  activeTab?: 'feed' | 'subscriptions' | 'favorites';
  onTabChange?: (tab: 'feed' | 'subscriptions' | 'favorites') => void;
}

export default function LeftNav({ activeTab = 'feed', onTabChange }: LeftNavProps) {
  const pathname = usePathname();

  const mainLinks = [
    { tab: 'feed' as const, label: 'Лента', icon: '/icons/blog/lenta.svg', href: '/blog' },
    { tab: 'favorites' as const, label: 'Избранное', icon: '/icons/blog/izbrannoe.svg', href: null },
  ];

  return (
    <aside className="w-[180px] shrink-0 hidden xl:block">
      <div className="sticky top-[84px] font-[Raleway]">

        {/* Основная навигация */}
        <nav className="space-y-0.5 mb-6">
          {mainLinks.map(({ tab, label, icon, href }) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => onTabChange?.(tab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors text-left
                  ${isActive
                    ? 'bg-[#f5f6f8] text-[#313131] font-semibold'
                    : 'text-[#52555a] hover:bg-[#f5f6f8] hover:text-[#313131]'
                  }`}
              >
                <Image src={icon} alt={label} width={18} height={18} className="shrink-0 opacity-70" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Разделитель */}
        <div className="h-px bg-[#e8eaed] mb-4" />

        {/* Ссылки */}
        <div className="space-y-1 text-[13px] text-[#8c9099] mb-6">
          <Link href="/about" className="block px-3 py-1.5 rounded-lg hover:text-[#313131] hover:bg-[#f5f6f8] transition-colors">О проекте</Link>
          <Link href="/documents" className="block px-3 py-1.5 rounded-lg hover:text-[#313131] hover:bg-[#f5f6f8] transition-colors">Документы</Link>
          <a href="https://t.me/edinayasredarf" target="_blank" rel="noopener noreferrer" className="block px-3 py-1.5 rounded-lg hover:text-[#313131] hover:bg-[#f5f6f8] transition-colors">Поддержка</a>
        </div>

        {/* Соцсети */}
        <div className="flex gap-2 px-3 mb-4">
          <a href="https://vk.com/edinayasredarf" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-[#f5f6f8] flex items-center justify-center hover:bg-[#e8eaed] transition-colors">
            <Image src="/icons/vk.svg" alt="VK" width={15} height={15} />
          </a>
          <a href="https://t.me/edinayasredarf" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-[#f5f6f8] flex items-center justify-center hover:bg-[#e8eaed] transition-colors">
            <Image src="/icons/tg.svg" alt="Telegram" width={15} height={15} />
          </a>
          <a href="https://dzen.ru/edinayasreda" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-[#f5f6f8] flex items-center justify-center hover:bg-[#e8eaed] transition-colors">
            <Image src="/icons/dzen.svg" alt="Дзен" width={15} height={15} />
          </a>
          <a href="https://vkvideo.ru/@edinayasreda" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-[#f5f6f8] flex items-center justify-center hover:bg-[#e8eaed] transition-colors">
            <Image src="/icons/vkvideo.svg" alt="VK Video" width={15} height={15} />
          </a>
        </div>

        <div className="px-3 text-[12px] text-[#b0b6c0]">© 2023–2025 Все права защищены</div>
      </div>
    </aside>
  );
}
