'use client';

import React from 'react';
import Link from 'next/link';
import { NewsItem, sb_listNews } from '@/lib/blogStore';

export default function RightSidebar() {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  React.  useEffect(() => {
    // Load news from Supabase
    (async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (error) {
        console.error('Failed to load news:', error);
        setNews([]);
      }
    })();
    
    const onFocus = async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (error) {
        console.error('Failed to refresh news:', error);
      }
    };
    
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <aside className="w-[287px] shrink-0 hidden xl:block">
      <div className="sticky top-[86px] space-y-4">
        <div className="p-5 bg-white rounded-3xl border space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#111]">Новости</h3>
            <Link href="/news" className="h-8 px-3 rounded-lg border text-sm flex items-center">Все</Link>
          </div>
          <div className="space-y-4">
            {news.slice(0,6).map(n => (
              <div key={n.id} className="space-y-1">
                <div className="text-sm text-[#52555a]">{new Date(n.createdAt).toLocaleDateString('ru-RU')}</div>
                <Link href={`/news/${n.slug}`} className="text-base text-[#111] leading-snug hover:underline">
                  {n.title}
                </Link>
              </div>
            ))}
            {!news.length && <div className="text-sm text-[#52555a]">Еще нет новостей</div>}
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border">
          <img src="https://placehold.co/286x424" alt="banner" className="w-full h-auto"/>
        </div>
      </div>
    </aside>
  );
}
