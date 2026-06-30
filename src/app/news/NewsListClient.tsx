'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { sb_listNews, NewsItem } from '@/lib/blogStore';
import { formatContentDate } from '@/lib/contentDates';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import { useRouter } from 'next/navigation';

let _newsListCache: NewsItem[] | null = null;

export default function NewsListClient() {
  const [news, setNews] = useState<NewsItem[]>(_newsListCache || []);
  const [loading, setLoading] = useState(!_newsListCache);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'subscriptions' | 'favorites'>('feed');

  useEffect(() => {
    (async () => {
      try {
        const data = await sb_listNews();
        _newsListCache = data;
        setNews(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleTabChange = (tab: 'feed' | 'subscriptions' | 'favorites') => {
    setActiveTab(tab);
    if (tab === 'feed') router.push('/blog');
    else if (tab === 'favorites') router.push('/blog?tab=favorites');
    else router.push('/blog?tab=subscriptions');
  };

  return (
    <div className="min-h-screen font-[Raleway] font-medium lining-nums">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-6 pb-16">
        <div className="flex gap-4">
          <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />

          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl p-5">
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-[17px] font-bold text-[#313131] font-[Raleway]">Новости</h1>
                <Link href="/blog" className="text-[14px] text-[#029cda] hover:text-[#0280b5] font-[Raleway] font-semibold flex items-center gap-1">
                  К статьям
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="flex items-start justify-between gap-3 py-2">
                      <div className="h-4 flex-1 bg-gray-100 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              ) : !news.length ? (
                <p className="text-[14px] text-[#8c9099]">Новостей пока нет</p>
              ) : (
                <div className="space-y-2">
                  {news.map((n, idx) => (
                    <React.Fragment key={n.id}>
                      {idx > 0 && <div className="h-px bg-[#e8eaed]" />}
                      <Link href={`/news/${encodeURIComponent(n.slug)}`} className="group flex items-start justify-between gap-3 py-0.5">
                        <div className="text-[15px] text-[#1a1a1a] leading-snug font-involve font-medium line-clamp-2 group-hover:text-[#029cda] transition-colors flex-1">
                          {n.title}
                        </div>
                        <span className="text-[12px] text-[#8c9099] shrink-0 mt-0.5">
                          {formatContentDate(n.createdAt, n.updatedAt)}
                        </span>
                      </Link>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </main>

          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
