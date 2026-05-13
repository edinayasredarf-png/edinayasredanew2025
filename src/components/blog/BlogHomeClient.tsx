'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopBar from '@/components/blog/TopBar';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import PostCard from '@/components/blog/PostCard';
import BlogLayout from '@/components/BlogLayout';
import type { BlogPost } from '@/lib/blogStore';
import { sb_getUserFavorites } from '@/lib/commentsStore';
import { authStore } from '@/lib/authStore';
import MobileBottomNav from '@/components/MobileBottomNav';

export default function BlogHomeClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const qFromUrl = sp.get('q') || '';
  const tag = sp.get('tag') || '';
  const sortFromUrl = (sp.get('sort') as 'popular' | 'fresh') || 'popular';
  const tabFromUrl = (sp.get('tab') as 'feed' | 'subscriptions' | 'favorites') || 'feed';

  const [q, setQ] = useState(qFromUrl);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts || []);
  const [activeTab, setActiveTab] = useState<'feed' | 'subscriptions' | 'favorites'>(tabFromUrl);
  const [favoritePostIds, setFavoritePostIds] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setPosts(initialPosts || []);
  }, [initialPosts]);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setIsAuthenticated(authStore.isAuthenticated());
    });
    setIsAuthenticated(authStore.isAuthenticated());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (activeTab === 'favorites' && isAuthenticated) {
      (async () => {
        try {
          const favorites = await sb_getUserFavorites();
          setFavoritePostIds(favorites.map((f) => f.post_id));
        } catch {
          setFavoritePostIds([]);
        }
      })();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    setQ(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    const error = sp.get('error');
    const success = sp.get('success');

    const showNotification = (type: 'success' | 'error', message: string) => {
      setNotification({ type, message });
      setTimeout(() => setNotification(null), 5000);
    };

    if (error) showNotification('error', decodeURIComponent(error));
    if (success) showNotification('success', decodeURIComponent(success));

    if (error || success) {
      const newSearchParams = new URLSearchParams(sp.toString());
      newSearchParams.delete('error');
      newSearchParams.delete('success');
      const newUrl = newSearchParams.toString() ? `/blog?${newSearchParams.toString()}` : '/blog';
      router.replace(newUrl, { scroll: false });
    }
  }, [sp, router]);

  const filtered = useMemo(() => {
    let arr = posts.filter((p) => (p.kind || 'post') !== 'case');

    if (activeTab === 'favorites') {
      if (!isAuthenticated) return [];
      arr = arr.filter((p) => favoritePostIds.includes(p.id));
    }

    if (tag) arr = arr.filter((p) => (p.tags || []).some((t) => t.toLowerCase() === tag.toLowerCase()));
    if (q) {
      const isTagQuery = q.startsWith('tag:');
      if (isTagQuery) {
        const t = q.slice(4).trim();
        arr = arr.filter((p) => (p.tags || []).some((x) => x.toLowerCase().includes(t)));
      } else {
        arr = arr.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.subtitle || '').toLowerCase().includes(q) ||
            (p.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      }
    }
    arr = [...arr].sort((a, b) => {
      if (sortFromUrl === 'popular') return (b.views || 0) - (a.views || 0);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return arr;
  }, [posts, q, tag, activeTab, favoritePostIds, isAuthenticated, sortFromUrl]);

  const cols = useMemo(() => {
    const A: BlogPost[] = [];
    const B: BlogPost[] = [];
    filtered.forEach((p, i) => (i % 2 === 0 ? A : B).push(p));
    return [A, B];
  }, [filtered]);

  return (
    <BlogLayout>
      <div className="bg-[#f2f3f7] min-h-screen font-{Raleway}">
        <TopBar />
        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg max-w-md ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-4 text-white hover:text-gray-200">
                ×
              </button>
            </div>
          </div>
        )}

        <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] pt-4 sm:pt-6 pb-8 sm:pb-16">
          <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
            <LeftNav activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="flex-1 flex justify-center">
              <div className="w-full max-w-[764px]">
                {activeTab === 'favorites' && !isAuthenticated ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg mb-4">Для просмотра избранного необходимо войти в систему</div>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
                      className="px-6 py-2 bg-[#029cda] text-white rounded-lg hover:bg-[#029cda]/90 transition-colors"
                    >
                      Войти
                    </button>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg mb-2">Посты временно недоступны</div>
                    <div className="text-gray-400 text-sm">Проверьте подключение к сети и обновите страницу</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                    {cols[0].map((p) => (
                      <PostCard key={p.id} p={p} />
                    ))}
                    {cols[1].map((p) => (
                      <PostCard key={p.id} p={p} />
                    ))}
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
