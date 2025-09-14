'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsPageClient from '@/components/blog/NewsPageClient';
import TopBar from '@/components/blog/TopBar';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import Link from 'next/link';
import { listNews, NewsItem, sb_listNews } from '@/lib/blogStore';

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" /> }>
      <NewsPageInner />
    </Suspense>
  );
}

function NewsPageInner() {
  const sp = useSearchParams();
  const slug = (sp.get('s') || '').trim();
  if (slug) return <NewsPageClient slug={slug} />;
  return <NewsList />;
}

function NewsList() {
  const [news, setNews] = useState<NewsItem[]>([]);
  useEffect(() => { 
    (async () => {
      try {
        const newsData = await sb_listNews();
        setNews(newsData);
      } catch (error) {
        console.error('Failed to load news from database:', error);
        setNews([]);
      }
    })();
  }, []);

  return (
    <div className="bg-[#f2f3f7] min-h-screen">
      <TopBar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] pt-4 sm:pt-6 pb-8 sm:pb-16">
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
          <LeftNav />
          <main className="flex-1 flex justify-center">
            <div className="w-full max-w-[761px]">
              <section className="bg-white rounded-3xl p-6 border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h1 className="text-2xl md:text-3xl font-semibold text-[#111]">Все новости</h1>
                  <Link href="/blog" className="h-9 px-3 rounded-lg bg-[#111] text-white hover:bg-[#333] text-sm flex items-center">К статьям</Link>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-4">
                  {news.map(n => (
                    <Link key={n.id} href={`/news/${n.slug}`} className="rounded-2xl border p-4 hover:border-[#2777ff] bg-white">
                      <div className="text-sm text-[#52555a]">{new Date(n.createdAt).toLocaleDateString('ru-RU')}</div>
                      <div className="mt-1 text-base font-semibold text-[#111] leading-snug">{n.title}</div>
                      {!!(n.tags?.length) && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {n.tags!.map(t => <span key={t} className="text-sm text-[#2777ff]">#{t}</span>)}
                        </div>
                      )}
                    </Link>
                  ))}
                  {!news.length && <div className="text-[#52555a]">Новостей пока нет</div>}
                </div>
              </section>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
