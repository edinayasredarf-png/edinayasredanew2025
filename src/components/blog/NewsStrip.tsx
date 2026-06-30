'use client';

import React from 'react';
import Link from 'next/link';
import { sb_listNews, NewsItem } from '@/lib/blogStore';
import { formatContentDate } from '@/lib/contentDates';

const PAGE = 5;

export default function NewsStrip() {
  const [news, setNews] = React.useState<NewsItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visible, setVisible] = React.useState(PAGE);
  const [loadingMore, setLoadingMore] = React.useState(false);

  React.useEffect(() => {
    sb_listNews().then(d => setNews(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    await new Promise(r => setTimeout(r, 200));
    setVisible(v => v + PAGE);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 mb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!news.length) return null;

  const shown = news.slice(0, visible);
  const hasMore = visible < news.length;

  return (
    <div className="bg-white rounded-2xl p-5 mb-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[17px] font-bold text-[#313131] font-[Raleway]">Новости</h2>
        <Link href="/news" className="text-[14px] text-[#029cda] hover:text-[#0280b5] font-[Raleway] font-semibold flex items-center gap-1">
          Все новости
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      <div className="space-y-2">
        {shown.map((n, idx) => (
          <React.Fragment key={n.id}>
            {idx > 0 && <div className="h-px bg-[#e8eaed]" />}
            <Link href={`/news/${n.slug}`} className="group flex items-start justify-between gap-3">
              <div className="text-[15px] text-[#1a1a1a] leading-snug font-involve font-medium line-clamp-2 group-hover:text-[#029cda] transition-colors flex-1">
                {n.title}
              </div>
              <span className="text-[12px] text-[#8c9099] font-[Raleway] shrink-0 mt-0.5">
                {formatContentDate(n.createdAt, n.updatedAt)}
              </span>
            </Link>
          </React.Fragment>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 w-full py-2.5 rounded-xl border border-[#e8eaed] text-[14px] font-semibold text-[#029cda] hover:bg-[#f0faff] transition-colors disabled:opacity-50 font-[Raleway]"
        >
          {loadingMore ? 'Загрузка...' : 'Ещё новости'}
        </button>
      )}
    </div>
  );
}
