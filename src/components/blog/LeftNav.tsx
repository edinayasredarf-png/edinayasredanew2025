'use client';
import React from 'react';
import Link from 'next/link';

interface ItemProps {
  active?: boolean;
  label: string;
  icon: string;
  onClick?: () => void;
}

function Item({ active, label, icon, onClick }: ItemProps) {
  return (
    <div 
      className={`w-full p-2 rounded-2xl inline-flex items-center gap-3 cursor-pointer hover:bg-white/50 transition-colors ${active ? 'bg-white border' : ''}`}
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-[#f2f3f7]' : 'bg-white border'}`}>
        <img src={icon} alt={label} className="w-5 h-5" />
      </div>
      <div className={`${active ? 'text-[#111]' : 'text-[#52555a]'} text-base`}>{label}</div>
    </div>
  );
}

interface LeftNavProps {
  activeTab?: 'feed' | 'subscriptions' | 'favorites';
  onTabChange?: (tab: 'feed' | 'subscriptions' | 'favorites') => void;
}

export default function LeftNav({ activeTab = 'feed', onTabChange }: LeftNavProps) {
  return (
    <aside className="w-[294px] shrink-0 hidden xl:block">
      <div className="sticky top-[86px] space-y-6">
        <nav className="space-y-3">
          <Item 
            active={activeTab === 'feed'} 
            label="Лента" 
            icon="/icons/blog/lenta.svg" 
            onClick={() => onTabChange?.('feed')}
          />
          <Item 
            active={activeTab === 'subscriptions'} 
            label="Подписки" 
            icon="/icons/blog/podpiski.svg" 
            onClick={() => onTabChange?.('subscriptions')}
          />
          <Item 
            active={activeTab === 'favorites'} 
            label="Избранное" 
            icon="/icons/blog/izbrannoe.svg" 
            onClick={() => onTabChange?.('favorites')}
          />
        </nav>

        <div className="space-y-3 text-sm text-[#52555a]">
          <Link href="/about" className="hover:text-[#111]">О проекте</Link>
          <div className="flex gap-5">
            <a href="#" className="hover:text-[#111]">Реклама</a>
            <a href="https://t.me/edinayasredarf" target="_blank" rel="noopener noreferrer" className="hover:text-[#111]">Поддержка</a>
          </div>
        </div>

        <div className="flex gap-3">
          <a href="https://vk.com/edinayasredarf" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] rounded-lg bg-[#A4A8B2] flex items-center justify-center hover:bg-[#9398a3] transition">
            <img src="/icons/vk.svg" alt="VK" className="w-4 h-4 brightness-0 invert" />
          </a>
          <a href="https://t.me/edinayasredarf" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] rounded-lg bg-[#A4A8B2] flex items-center justify-center hover:bg-[#9398a3] transition">
            <img src="/icons/tg.svg" alt="Telegram" className="w-4 h-4 brightness-0 invert" />
          </a>
          <a href="https://dzen.ru/edinayasreda" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] rounded-lg bg-[#A4A8B2] flex items-center justify-center hover:bg-[#9398a3] transition">
            <img src="/icons/dzen.svg" alt="Дзен" className="w-4 h-4 brightness-0 invert" />
          </a>
          <a href="https://vkvideo.ru/@edinayasreda" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] rounded-lg bg-[#A4A8B2] flex items-center justify-center hover:bg-[#9398a3] transition">
            <img src="/icons/vkvideo.svg" alt="VK Video" className="w-4 h-4 brightness-0 invert" />
          </a>
        </div>

        <div className="text-[#52555a] text-sm">© 2023–2025<br/>Все права защищены</div>
      </div>
    </aside>
  );
}
