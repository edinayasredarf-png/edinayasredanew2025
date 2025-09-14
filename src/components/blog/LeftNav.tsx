'use client';
import React from 'react';

function Item({ active, label, icon }: { active?: boolean; label: string; icon: string; }) {
  return (
    <div className={`w-full p-2 rounded-2xl inline-flex items-center gap-3 ${active ? 'bg-white border' : ''}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-[#f2f3f7]' : 'bg-white border'}`}>
        <img src={icon} alt={label} className="w-5 h-5" />
      </div>
      <div className={`${active ? 'text-[#111]' : 'text-[#52555a]'} text-base`}>{label}</div>
    </div>
  );
}

export default function LeftNav() {
  return (
    <aside className="w-[294px] shrink-0 hidden xl:block">
      <div className="sticky top-[86px] space-y-6">
        <nav className="space-y-3">
          <Item active label="Лента" icon="/icons/blog/lenta.svg" />
          <Item label="Подписки" icon="/icons/blog/podpiski.svg" />
          <Item label="Избранное" icon="/icons/blog/izbrannoe.svg" />
        </nav>

        <div className="space-y-3 text-sm text-[#52555a]">
          <a href="#" className="hover:text-[#111]">О проекте</a>
          <div className="flex gap-5">
            <a href="#" className="hover:text-[#111]">Реклама</a>
            <a href="#" className="hover:text-[#111]">Поддержка</a>
          </div>
        </div>

        <div className="flex gap-3">
          <a href="#" className="w-[30px] h-[30px] rounded-lg bg-[#a4a8b2]" />
          <a href="#" className="w-[30px] h-[30px] rounded-lg bg-[#a4a8b2]" />
        </div>

        <div className="text-[#52555a] text-sm">© 2023–2025<br/>Все права защищены</div>
      </div>
    </aside>
  );
}
