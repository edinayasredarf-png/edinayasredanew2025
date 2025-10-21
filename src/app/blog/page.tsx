'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/blog/TopBar';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import PostCard from '@/components/blog/PostCard';
import { BlogPost, ensureDemo, sb_listPosts } from '@/lib/blogStore';
import { sb_getUserFavorites } from '@/lib/commentsStore';
import { authStore } from '@/lib/authStore';
import { useSearchParams } from 'next/navigation';

function BlogHomeInner() {
  const sp = useSearchParams();
  const qFromUrl = sp.get('q') || '';
  const tag = sp.get('tag') || '';
  const [q, setQ] = useState(qFromUrl);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'subscriptions' | 'favorites'>('feed');
  const [favoritePostIds, setFavoritePostIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => { 
    ensureDemo();
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

  // Подписываемся на изменения аутентификации
  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setIsAuthenticated(authStore.isAuthenticated());
    });
    setIsAuthenticated(authStore.isAuthenticated());
    return unsubscribe;
  }, []);

  // Загружаем избранное при смене вкладки
  useEffect(() => {
    if (activeTab === 'favorites' && isAuthenticated) {
      (async () => {
        try {
          const favorites = await sb_getUserFavorites();
          setFavoritePostIds(favorites.map(f => f.post_id));
        } catch (error) {
          console.error('Failed to load favorites:', error);
          setFavoritePostIds([]);
        }
      })();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => { setQ(qFromUrl); }, [qFromUrl]);

  const filtered = useMemo(() => {
    // Исключаем кейсы из ленты блога
    let arr = posts.filter(p => (p.kind || 'post') !== 'case');
    
    // Фильтрация по активной вкладке
    if (activeTab === 'favorites') {
      if (!isAuthenticated) {
        return []; // Показываем пустой список, если не авторизован
      }
      arr = arr.filter(p => favoritePostIds.includes(p.id));
    }
    
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
  }, [posts, q, tag, activeTab, favoritePostIds, isAuthenticated]);

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
          <LeftNav activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 flex justify-center">
            <div className="w-full max-w-[761px]">
              {activeTab === 'favorites' && !isAuthenticated ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg mb-4">
                    Для просмотра избранного необходимо войти в систему
                  </div>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Войти
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                  {cols[0].map(p => <PostCard key={p.id} p={p} />)}
                  {cols[1].map(p => <PostCard key={p.id} p={p} />)}
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

export default function BlogHome() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f2f3f7] flex items-center justify-center">Загрузка…</div>}>
      <BlogHomeInner />
    </Suspense>
  );
}
