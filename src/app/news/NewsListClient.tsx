'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import { sb_listNews, NewsItem } from '@/lib/blogStore';
import { formatContentDate } from '@/lib/contentDates';

let _newsListCache: NewsItem[] | null = null;

export default function NewsListClient() {
  const [news, setNews] = useState<NewsItem[]>(_newsListCache || []);
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<'feed' | 'subscriptions' | 'favorites'>('feed');

  useEffect(() => {
    (async () => {
      try {
        const newsData = await sb_listNews();
        _newsListCache = newsData;
        setNews(newsData);
      } catch (e) {
        console.error('Failed to load news from database:', e);
      }
    })();
  }, []);

  const handleTabChange = (tab: 'feed' | 'subscriptions' | 'favorites') => {
    setActiveTab(tab);

    if (tab === 'feed') {
      router.push('/blog');
    } else if (tab === 'favorites') {
      router.push('/blog?tab=favorites');
    } else if (tab === 'subscriptions') {
      router.push('/blog?tab=subscriptions');
    }
  };

  return (
    <div className="bg-[#F6F7F9] min-h-screen font-[Raleway] font-medium lining-nums">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 xl:px-[50px] pt-6 pb-8 sm:pb-16">
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
          <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />

          <main className="flex-1 flex justify-center">
            <div className="w-full max-w-[761px]">
              <section className="bg-white rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl md:text-3xl font-semibold text-[#313131]">
                    Все новости
                  </h1>
                  <Link
                    href="/blog"
                    className="h-9 px-3 rounded-lg border border-[#DCDDE1] text-sm text-[#313131] flex items-center"
                  >
                    К статьям
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4">
                  {news.map((n) => (
                    <Link
                      key={n.id}
                      href={`/news/${encodeURIComponent(n.slug)}`}
                      className="rounded-2xl border border-[#DCDDE1] p-4 bg-white"
                    >
                      <div className="text-sm text-[#52555a]">
                        {formatContentDate(n.createdAt, n.updatedAt)}
                      </div>
                      <div className="mt-1 text-base font-semibold text-[#313131] leading-snug">
                        {n.title}
                      </div>
                      {!!(n.tags?.length) && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {n.tags!.map((t) => (
                            <span key={t} className="text-sm text-[#7C8A9A]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}

                  {!news.length && (
                    <div className="text-[#7C8A9A]">Новостей пока нет</div>
                  )}
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

