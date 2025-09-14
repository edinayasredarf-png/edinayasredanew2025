'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/blog/TopBar';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import PostCard from '@/components/blog/PostCard';
import { BlogPost, ensureDemo, listPosts, sb_listPosts } from '@/lib/blogStore';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

function BlogHomeInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qFromUrl = sp.get('q') || '';
  const tag = sp.get('tag') || '';
  const [q, setQ] = useState(qFromUrl);
  const [contentType, setContentType] = useState<'all' | 'post' | 'news' | 'lesson' | 'case'>('all');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  useEffect(() => { ensureDemo();
    (async () => {
      try {
        const fromSb = await sb_listPosts();
        setPosts(fromSb);
      } catch (error) {
        console.error('Failed to load posts from database:', error);
        setPosts([]);
      }
    })();
  }, []);

  useEffect(() => { setQ(qFromUrl); }, [qFromUrl]);

  const goSearch = (value: string, type?: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set('q', value); else params.delete('q');
    if (type && type !== 'all') params.set('type', type); else params.delete('type');
    router.push(`${pathname}?${params.toString()}`);
  };

  const filtered = useMemo(() => {
    let arr = posts;
    if (tag) arr = arr.filter(p => (p.tags||[]).some(t => t.toLowerCase() === tag.toLowerCase()));
    if (q) {
      const isTagQuery = q.startsWith('tag:');
      if (isTagQuery) {
        const t = q.slice(4).trim();
        arr = arr.filter(p => (p.tags||[]).some(x => x.toLowerCase().includes(t)));
      } else {
        arr = arr.filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.subtitle||'').toLowerCase().includes(q) ||
          (p.tags||[]).some(t => t.toLowerCase().includes(q))
        );
      }
    }
    // Filter by content type
    if (contentType !== 'all') {
      arr = arr.filter(p => p.kind === contentType);
    }
    return arr;
  }, [posts, q, tag, contentType]);

  const cols = useMemo(() => {
    const A: BlogPost[] = [], B: BlogPost[] = [];
    filtered.forEach((p, i) => (i % 2 === 0 ? A : B).push(p));
    return [A, B];
  }, [filtered]);


  return (
    <div className="bg-[#f2f3f7] min-h-screen">
      <TopBar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] pt-4 sm:pt-6 pb-8 sm:pb-16">
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
          <LeftNav />
          <main className="flex-1 flex justify-center">
            <div className="w-full max-w-[761px]">
              {/* Search bar - positioned exactly above cards */}
              <div className="mb-6 hidden md:block">
                <div className="h-[46px] relative">
                  <div className="absolute inset-0 bg-white rounded-xl border border-[#e1e2e5] flex items-center pl-12 pr-3">
                    <input
                      value={q}
                      onChange={(e)=>{ setQ(e.target.value); }}
                      onKeyDown={(e)=>{ if(e.key==='Enter') goSearch(q, contentType); }}
                      placeholder="Поиск по статьям и тегам (например: tag:UI)"
                      className="flex-1 outline-none text-[15px] placeholder:text-[#52555a] text-[#111]"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={contentType}
                        onChange={e => setContentType(e.target.value as any)}
                        className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white text-[#111] focus:ring-2 focus:ring-[#2777ff] focus:border-transparent"
                      >
                        <option value="all">Все</option>
                        <option value="post">Статьи</option>
                        <option value="news">Новости</option>
                        <option value="lesson">Уроки</option>
                        <option value="case">Кейсы</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={()=>goSearch(q, contentType)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-lg flex items-center justify-center hover:bg-[#f2f3f7]">
                    <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] text-[#a4a8b2]">
                      <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                {cols[0].map(p => <PostCard key={p.id} p={p} />)}
                {cols[1].map(p => <PostCard key={p.id} p={p} />)}
              </div>

            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

export default function BlogHome() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f2f3f7] flex items-center justify-center">Загрузка…</div>}>
      <BlogHomeInner />
    </Suspense>
  );
}
