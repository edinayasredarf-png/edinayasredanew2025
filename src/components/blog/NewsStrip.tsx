'use client';

import React from 'react';
import Link from 'next/link';
import { sb_listNews, NewsItem } from '@/lib/blogStore';
import { formatContentDate } from '@/lib/contentDates';

let _cache: NewsItem[] | null = null;

export default function NewsStrip() {
  const [news, setNews] = React.useState<NewsItem[]>(_cache || []);
  const [loading, setLoading] = React.useState(_cache === null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (_cache) { setLoading(false); return; }
    sb_listNews().then(d => { _cache = d; setNews(d); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8eaed] p-4 mb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3,4].map(i => (
            <div key={i} className="shrink-0 w-[180px] space-y-1.5">
              <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!news.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e8eaed] p-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-[#313131] font-[Raleway]">Новости</h2>
        <Link href="/news" className="text-[13px] text-[#029cda] hover:text-[#0280b5] font-[Raleway] font-medium flex items-center gap-1">
          Все новости
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {news.slice(0, 8).map((n, idx) => (
          <React.Fragment key={n.id}>
            {idx > 0 && <div className="shrink-0 w-px bg-[#e8eaed] self-stretch" />}
            <Link
              href={`/news/${n.slug}`}
              className="shrink-0 w-[200px] group"
            >
              <div className="text-[11px] text-[#8c9099] font-[Raleway] mb-1">
                {formatContentDate(n.createdAt, n.updatedAt)}
              </div>
              <div className="text-[13px] text-[#313131] leading-snug font-[Raleway] font-medium line-clamp-3 group-hover:text-[#029cda] transition-colors">
                {n.title}
              </div>
            </Link>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
