'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import PostCard from '@/components/blog/PostCard';
import NewsStrip from '@/components/blog/NewsStrip';
import BlogLayout from '@/components/BlogLayout';
import { BlogPost, ensureDemo, sb_listPosts } from '@/lib/blogStore';
import { sb_getUserFavorites } from '@/lib/commentsStore';
import { authStore } from '@/lib/authStore';
import { useSearchParams } from 'next/navigation';
import MobileBottomNav from '@/components/MobileBottomNav';

let _postsCache: BlogPost[] | null = null;

function BlogHomeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const qFromUrl = sp.get('q') || '';
  const tag = sp.get('tag') || '';
  const tabFromUrl = (sp.get('tab') as 'feed' | 'subscriptions' | 'favorites') || 'feed';

  const [q, setQ] = useState(qFromUrl);
  const [posts, setPosts] = useState<BlogPost[]>(_postsCache || []);
  const [activeTab, setActiveTab] = useState<'feed' | 'subscriptions' | 'favorites'>(tabFromUrl);
  const [favoritePostIds, setFavoritePostIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    ensureDemo();
    (async () => {
      try {
        const fromSb = await sb_listPosts();
        _postsCache = fromSb;
        setPosts(fromSb);
      } catch {
        setPosts([]);
      }
    })();
  }, []);

  useEffect(() => {
    const unsub = authStore.subscribe(() => setIsAuthenticated(authStore.isAuthenticated()));
    setIsAuthenticated(authStore.isAuthenticated());
    return unsub;
  }, []);

  useEffect(() => {
    if (activeTab === 'favorites' && isAuthenticated) {
      sb_getUserFavorites()
        .then(favs => setFavoritePostIds(favs.map(f => f.post_id)))
        .catch(() => setFavoritePostIds([]));
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => { setQ(qFromUrl); }, [qFromUrl]);
  useEffect(() => { setActiveTab(tabFromUrl); }, [tabFromUrl]);

  useEffect(() => {
    const error = sp.get('error');
    const success = sp.get('success');
    if (error) { setNotification({ type: 'error', message: decodeURIComponent(error) }); setTimeout(() => setNotification(null), 5000); }
    if (success) { setNotification({ type: 'success', message: decodeURIComponent(success) }); setTimeout(() => setNotification(null), 5000); }
    if (error || success) {
      const p = new URLSearchParams(sp.toString());
      p.delete('error'); p.delete('success');
      router.replace(p.toString() ? `/blog?${p.toString()}` : '/blog', { scroll: false });
    }
  }, [sp, router]);

  const filtered = useMemo(() => {
    let arr = posts.filter(p => (p.kind || 'post') !== 'case');
    if (activeTab === 'favorites') {
      if (!isAuthenticated) return [];
      arr = arr.filter(p => favoritePostIds.includes(p.id));
    }
    if (tag) arr = arr.filter(p => (p.tags || []).some(t => t.toLowerCase() === tag.toLowerCase()));
    if (q) {
      const isTagQ = q.startsWith('tag:');
      if (isTagQ) {
        const t = q.slice(4).trim();
        arr = arr.filter(p => (p.tags || []).some(x => x.toLowerCase().includes(t)));
      } else {
        arr = arr.filter(p =>
          p.title.toLowerCase().includes(q.toLowerCase()) ||
          (p.subtitle || '').toLowerCase().includes(q.toLowerCase()) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q.toLowerCase()))
        );
      }
    }
    // Всегда свежие сверху: последние статьи в начале, дальше по дате.
    return [...arr].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [posts, q, tag, activeTab, favoritePostIds, isAuthenticated]);

  return (
    <BlogLayout>
      <div className="min-h-screen font-[Raleway]">

        {/* Уведомления */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg max-w-sm flex items-center justify-between gap-4 text-sm font-medium ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white text-lg leading-none">×</button>
          </div>
        )}

        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-6 pb-16">
          <div className="flex gap-4">

            {/* Левый сайдбар */}
            <LeftNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Основной контент */}
            <main className="flex-1 min-w-0">

              {/* Полоска новостей — только в общей ленте */}
              {activeTab === 'feed' && !q && !tag && <NewsStrip />}

              {/* Активные фильтры */}
              {(tag || q) && (
                <div className="flex items-center gap-2 mb-3">
                  {tag && (
                    <div className="flex items-center gap-2 bg-white border border-[#e8eaed] rounded-xl px-3 py-1.5 text-[13px] font-medium text-[#313131]">
                      <span className="text-[#8c9099]">Тег:</span> #{tag}
                      <button onClick={() => router.push('/blog')} className="text-[#8c9099] hover:text-[#313131] ml-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  )}
                  {q && (
                    <div className="flex items-center gap-2 bg-white border border-[#e8eaed] rounded-xl px-3 py-1.5 text-[13px] font-medium text-[#313131]">
                      <span className="text-[#8c9099]">Поиск:</span> {q}
                      <button onClick={() => router.push('/blog')} className="text-[#8c9099] hover:text-[#313131] ml-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Посты */}
              {activeTab === 'favorites' && !isAuthenticated ? (
                <div className="bg-white rounded-2xl border border-[#e8eaed] p-12 text-center">
                  <div className="text-[15px] text-[#8c9099] mb-4">Войдите, чтобы видеть избранное</div>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
                    className="h-10 px-6 bg-[#029cda] text-white text-[14px] font-semibold rounded-xl hover:bg-[#0280b5] transition-colors"
                  >
                    Войти
                  </button>
                </div>
              ) : posts.length === 0 ? (
                // Skeleton
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-[#e8eaed] p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                          <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                      <div className="w-full aspect-[16/9] bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e8eaed] p-12 text-center">
                  <div className="text-[15px] text-[#8c9099]">Ничего не найдено</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(p => <PostCard key={p.id} p={p} />)}
                </div>
              )}
            </main>

            {/* Правый сайдбар */}
            <RightSidebar />
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </BlogLayout>
  );
}

export default function BlogHome() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#029cda]" />
      </div>
    }>
      <BlogHomeInner />
    </Suspense>
  );
}
