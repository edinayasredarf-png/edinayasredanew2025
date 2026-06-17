'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/blog/TopBar';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import PostCard from '@/components/blog/PostCard';
import BlogLayout from '@/components/BlogLayout';
import { BlogPost, ensureDemo, sb_listPosts } from '@/lib/blogStore';
import { sb_getUserFavorites } from '@/lib/commentsStore';
import { authStore } from '@/lib/authStore';
import { useSearchParams } from 'next/navigation';
import MobileBottomNav from '@/components/MobileBottomNav';

// MUI Skeleton
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

// Модульный кэш — переживает навигацию между страницами
let _postsCache: BlogPost[] | null = null;

function BlogHomeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const qFromUrl = sp.get('q') || '';
  const tag = sp.get('tag') || '';
  const sortFromUrl = (sp.get('sort') as 'popular' | 'fresh') || 'popular';
  const tabFromUrl = (sp.get('tab') as 'feed' | 'subscriptions' | 'favorites') || 'feed';

  const [q, setQ] = useState(qFromUrl);
  const [posts, setPosts] = useState<BlogPost[]>(_postsCache || []);
  const [activeTab, setActiveTab] = useState<'feed' | 'subscriptions' | 'favorites'>(tabFromUrl);
  const [favoritePostIds, setFavoritePostIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Загрузка постов (с кэшем — при повторном визите данные уже есть)
  useEffect(() => {
    ensureDemo();
    (async () => {
      try {
        const fromSb = await sb_listPosts();
        _postsCache = fromSb;
        setPosts(fromSb);
      } catch (error) {
        console.error('Failed to load posts from database:', error);
        setPosts([]);
      }
    })();
  }, []);

  // Подписка на изменения аутентификации
  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setIsAuthenticated(authStore.isAuthenticated());
    });
    setIsAuthenticated(authStore.isAuthenticated());
    return unsubscribe;
  }, []);

  // Загрузка избранного при смене вкладки
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

  // Синхронизация query параметров
  useEffect(() => { setQ(qFromUrl); }, [qFromUrl]);
  useEffect(() => { setActiveTab(tabFromUrl); }, [tabFromUrl]);

  // Обработка уведомлений через query параметры
  useEffect(() => {
    const error = sp.get('error');
    const success = sp.get('success');

    const showNotification = (type: 'success' | 'error', message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 5000);
    };

    if (error) {
      showNotification('error', decodeURIComponent(error));
    }

    if (success) {
      showNotification('success', decodeURIComponent(success));
    }

    if (error || success) {
      const newSearchParams = new URLSearchParams(sp.toString());
      newSearchParams.delete('error');
      newSearchParams.delete('success');
      const newUrl = newSearchParams.toString() ? `/blog?${newSearchParams.toString()}` : '/blog';
      router.replace(newUrl, { scroll: false });
    }
  }, [sp, router]);

  // Фильтрация постов
  const filtered = useMemo(() => {
    let arr = posts.filter(p => (p.kind || 'post') !== 'case');

    if (activeTab === 'favorites') {
      if (!isAuthenticated) return [];
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
    arr = [...arr].sort((a, b) => {
      if (sortFromUrl === 'popular') {
        return (b.views || 0) - (a.views || 0);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return arr;
  }, [posts, q, tag, activeTab, favoritePostIds, isAuthenticated, sortFromUrl]);

  // Разделение на две колонки
  const cols = useMemo(() => {
    const A: BlogPost[] = [], B: BlogPost[] = [];
    filtered.forEach((p, i) => (i % 2 === 0 ? A : B).push(p));
    return [A, B];
  }, [filtered]);

  return (
    <BlogLayout>
      <div className="bg-[#f2f3f7] min-h-screen font-raleway">
        <TopBar />

        {/* Уведомления */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg max-w-md ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] pt-4 sm:pt-6 pb-8 sm:pb-16">
          <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
            <LeftNav activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="flex-1 flex justify-center">
              <div className="w-full max-w-[764px]">
                {/* Не авторизован + избранное */}
                {activeTab === 'favorites' && !isAuthenticated ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg mb-4">
                      Для просмотра избранного необходимо войти в систему
                    </div>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
                      className="px-6 py-2 bg-[#029cda] text-white rounded-lg hover:bg-[#029cda]/90 transition-colors"
                    >
                      Войти
                    </button>
                  </div>
                ) : posts.length === 0 ? (
                  // Skeleton пока загружаются посты
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Stack key={i} spacing={1}>
                        <Skeleton variant="rectangular" sx={{ borderRadius: 6 }} width={350} height={200} />
                        <Skeleton variant="text" width={300} height={30} />
                        <Skeleton variant="text" width={250} height={20} />
                      </Stack>
                    ))}
                  </div>
                ) : (
                  // Рендер постов
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
      <MobileBottomNav mode="blog" blogSort={sortFromUrl} />
    </BlogLayout>
  );
}

export default function BlogHome() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f2f3f7] flex items-center justify-center">Загрузка…</div>}>
      <BlogHomeInner />
    </Suspense>
  );
}