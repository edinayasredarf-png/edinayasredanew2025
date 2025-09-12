'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/blog/TopBar';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import PostCard from '@/components/blog/PostCard';
import { BlogPost, ensureDemo, listPosts, sb_listPosts } from '@/lib/blogStore';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function BlogHomeInner() {
  const sp = useSearchParams();
  const q = (sp.get('q') || '').trim().toLowerCase();
  const tag = sp.get('tag') || '';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  useEffect(() => { ensureDemo();
    (async () => {
      const fromSb = await sb_listPosts().catch(()=>listPosts());
      setPosts(fromSb);
    })();
  }, []);

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
    return arr;
  }, [posts, q, tag]);

  const cols = useMemo(() => {
    const A: BlogPost[] = [], B: BlogPost[] = [];
    filtered.forEach((p, i) => (i % 2 === 0 ? A : B).push(p));
    return [A, B];
  }, [filtered]);

  const popular = useMemo(() => {
    return [...posts].sort((a,b)=>{
      const sa = (a.reactions?.heart||0)+(a.reactions?.fire||0)+(a.reactions?.smile||0);
      const sb = (b.reactions?.heart||0)+(b.reactions?.fire||0)+(b.reactions?.smile||0);
      return sb - sa;
    }).slice(0,4);
  }, [posts]);

  return (
    <div className="bg-[#f2f3f7] min-h-screen">
      <TopBar />
      <div className="max-w-[1440px] mx-auto px-[34px] pt-6 pb-16">
        <div className="flex gap-[15px]">
          <LeftNav />
          <main className="flex-1 flex justify-center">
            <div className="w-full max-w-[761px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                {cols[0].map(p => <PostCard key={p.id} p={p} />)}
                {cols[1].map(p => <PostCard key={p.id} p={p} />)}
              </div>

              <div className="mt-8 p-5 bg-white rounded-3xl border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#111]">Популярные статьи</h3>
                  <Link href="/blog" className="text-sm text-[#2777ff]">все</Link>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {popular.map(p=>(
                    <a key={p.id} href={`/blog/${p.slug}`} className="rounded-2xl border p-3 hover:border-[#2777ff] transition block">
                      <div className="w-full aspect-[16/10] bg-[#f2f3f7] rounded-xl overflow-hidden">
                        <img src={p.cover || 'https://placehold.co/400x225'} className="w-full h-full object-cover" />
                      </div>
                      <div className="mt-2 text-sm text-[#52555a]">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</div>
                      <div className="text-sm font-semibold text-[#111] leading-snug line-clamp-2">{p.title}</div>
                    </a>
                  ))}
                </div>
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
