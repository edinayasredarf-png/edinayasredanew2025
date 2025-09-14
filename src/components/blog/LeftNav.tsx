'use client';
import React from 'react';
import Link from 'next/link';

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
          <Link href="/about" className="hover:text-[#111]">О проекте</Link>
          <div className="flex gap-5">
            <a href="#" className="hover:text-[#111]">Реклама</a>
            <a href="https://t.me/edinayasreda" target="_blank" rel="noopener noreferrer" className="hover:text-[#111]">Поддержка</a>
          </div>
        </div>

        <div className="flex gap-3">
          <a href="https://vk.com/edinayasreda" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] rounded-lg bg-[#a4a8b2] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.441 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.441-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.678.102.17.203.22.441.22.22 0 .373-.102.61-.407.254-.322 1.169-1.744 1.169-1.744.135-.203.373-.406.61-.406h1.744c.525 0 .644.271.525.643-.22 1.186-1.744 3.896-1.744 3.896-.135.254-.203.39 0 .644.102.203.441.441.661.644.22.203.39.39.525.644.17.254.085.508-.135.508z"/>
            </svg>
          </a>
          <a href="https://t.me/edinayasreda" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] rounded-lg bg-[#a4a8b2] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
          <a href="https://dzen.ru/edinayasreda" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] rounded-lg bg-[#a4a8b2] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169 1.858-.896 3.46-2.128 4.67-1.235 1.212-2.77 1.94-4.44 1.94-1.67 0-3.205-.728-4.44-1.94-1.232-1.21-1.959-2.812-2.128-4.67-.02-.22-.02-.44 0-.66.169-1.858.896-3.46 2.128-4.67C8.795 1.628 10.33.9 12 .9s3.205.728 4.44 1.94c1.232 1.21 1.959 2.812 2.128 4.67.02.22.02.44 0 .66z"/>
            </svg>
          </a>
          <a href="https://vk.com/video/@edinayasreda" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] rounded-lg bg-[#a4a8b2] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>

        <div className="text-[#52555a] text-sm">© 2023–2025<br/>Все права защищены</div>
      </div>
    </aside>
  );
}
