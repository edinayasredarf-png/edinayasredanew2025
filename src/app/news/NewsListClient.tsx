'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import TopBar from '@/components/blog/TopBar';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import { NewsItem } from '@/lib/blogStore';

let _newsListCache: NewsItem[] | null = null;

export default function NewsListClient() {
  const [news, setNews] = useState<NewsItem[]>(_newsListCache || []);
  const [hasLoadError, setHasLoadError] = useState(false);
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState<'feed' | 'subscriptions' | 'favorites'>('feed');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content/news', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { items?: NewsItem[] };
        const newsData = data.items || [];
        _newsListCache = newsData;
        setNews(newsData);
        setHasLoadError(false);
      } catch (e) {
        console.error('Failed to load news from API:', e);
        setNews([]);
        setHasLoadError(true);
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
    <div className="bg-[#f2f3f7] min-h-screen font-[Raleway] font-medium lining-nums">
      <TopBar />
      <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] pt-4 sm:pt-6 pb-8 sm:pb-16">
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
          <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />

          <main className="flex-1 flex justify-center">
            <div className="w-full max-w-[761px]">
              <section className="bg-white rounded-3xl p-6 border">
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
                  {hasLoadError && (
                    <div className="rounded-2xl border border-[#FFD4D4] bg-[#FFF4F4] p-4 text-[#9A2C2C]">
                      Не удалось загрузить новости. Проверьте подключение и попробуйте обновить страницу.
                    </div>
                  )}
                  {news.map((n) => (
                    <Link
                      key={n.id}
                      href={`/news/${encodeURIComponent(n.slug)}`}
                      className="rounded-2xl border border-[#DCDDE1] p-4 hover:border-[#2777ff] bg-white"
                    >
                      <div className="text-sm text-[#52555a]">
                        {new Date(n.createdAt).toLocaleDateString('ru-RU')}
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

