'use client';

import React, { useEffect, useState } from 'react';
import '@/styles/article-content.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import {
  NewsItem,
  deleteNewsById,
  sb_getNewsBySlug,
  sb_incViews,
  sb_deleteNewsById,
} from '@/lib/blogStore';
import { authStore } from '@/lib/authStore';
import { sb_isFavorite, sb_toggleFavorite } from '@/lib/commentsStore';
import CommentSection from '@/components/blog/CommentSection';
import AuthModal from '@/components/auth/AuthModal';
import { formatContentDate } from '@/lib/contentDates';

export default function NewsPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem | undefined>();
  const [newsLoading, setNewsLoading] = useState(true);
  const [isEditor, setIsEditor] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'subscriptions' | 'favorites'>('feed');

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setIsEditor(authStore.canWriteArticles());
      setIsAuthenticated(authStore.isAuthenticated());
    });
    setIsEditor(authStore.canWriteArticles());
    setIsAuthenticated(authStore.isAuthenticated());
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleNewsUpdate = () => {
      if (slug) {
        (async () => {
          const n = await sb_getNewsBySlug(slug);
          setNews(n);
        })();
      }
    };
    window.addEventListener('newsUpdated', handleNewsUpdate);
    return () => window.removeEventListener('newsUpdated', handleNewsUpdate);
  }, [slug]);

  useEffect(() => {
    const handleOpenAuthModal = () => setShowAuthModal(true);
    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  // SEO
  useEffect(() => {
    if (!news?.title) return;
    document.title = `${news.title} | Единая среда`;
    const strip = (html: string) =>
      html.replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const desc = strip(news.contentHtml || '').slice(0, 180);
    if (desc) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', desc);
    }
  }, [news?.title, news?.contentHtml]);

  const handleTabChange = (tab: 'feed' | 'subscriptions' | 'favorites') => {
    setActiveTab(tab);
    if (tab === 'favorites') {
      if (!isAuthenticated) { setShowAuthModal(true); return; }
      router.push('/blog?tab=favorites');
    } else if (tab === 'feed') {
      router.push('/blog');
    }
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const n = await sb_getNewsBySlug(slug);
      setNews(n);
      setNewsLoading(false);
      if (n) {
        await sb_incViews('news', n.slug);
        try {
          const fav = await sb_isFavorite(n.id, 'news');
          setIsFavorite(fav);
        } catch {}
      }
    })();
  }, [slug]);

  const handleFavorite = async () => {
    if (!news) return;
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    try {
      setLoading(true);
      const newStatus = await sb_toggleFavorite(news.id, 'news');
      setIsFavorite(newStatus);
    } catch {
      alert('Ошибка при изменении избранного');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
  };

  const doDelete = async () => {
    if (!news || !confirm('Удалить новость?')) return;
    try {
      await sb_deleteNewsById(news.id);
    } catch {
      deleteNewsById(news.id);
    }
    setNews(undefined);
    router.push('/news');
  };

  if (newsLoading) {
    return (
      <div className="bg-[#F6F7F9] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-4 sm:pt-6 pb-8 sm:pb-16">
          <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
            <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="flex-1 flex justify-center">
              <div className="w-full max-w-[761px] flex items-center justify-center min-h-[60vh]">
                <div className="w-full space-y-4 animate-pulse">
                  <div className="h-8 bg-[#e4e7ec] rounded-xl w-3/4" />
                  <div className="h-52 bg-[#e4e7ec] rounded-2xl w-full" />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 bg-[#e4e7ec] rounded-lg" style={{ width: `${100 - i * 6}%` }} />
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

  if (!news) {
    return (
      <div className="bg-[#F6F7F9] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-4 sm:pt-6 pb-8 sm:pb-16">
          <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
            <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="flex-1 flex justify-center">
              <div className="w-full max-w-[761px] text-center py-16">
                <h1 className="text-3xl font-semibold mb-3 text-[#313131]">Новость не найдена</h1>
                <Link href="/news" className="text-[#029cda] hover:underline">К новостям</Link>
              </div>
            </main>
            <RightSidebar />
          </div>
        </div>
      </div>
    );
  }

  const views = news.views || 0;

  return (
    <div className="bg-[#F6F7F9] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-4 sm:pt-6 pb-8 sm:pb-16">
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
          <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />
          <main className="flex-1 flex justify-center">
            <div className="w-full max-w-[761px] font-[Raleway] font-medium lining-nums">

              <section>
                <h1 className="mb-4 text-2xl md:text-3xl font-bold leading-tight text-[#313131]">{news.title}</h1>

                <article className="prose prose-lg max-w-none mx-auto text-[#313131] font-[Raleway] font-medium article-content" dir="ltr">
                  <div dangerouslySetInnerHTML={{ __html: news.contentHtml || '<p>Подробностей нет.</p>' }} />
                </article>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2 mt-14">
                  {isEditor && (
                    <div className="ml-auto flex items-center gap-2">
                      <Link
                        href={`/blog/new?edit=${encodeURIComponent(news.slug)}&type=news`}
                        className="h-9 px-3 rounded-lg bg-[#313131] text-white hover:bg-[#333] text-sm flex items-center"
                      >
                        Редактировать
                      </Link>
                      <button onClick={doDelete} className="h-9 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">
                        Удалить
                      </button>
                    </div>
                  )}
                </div>

                {!!(news.tags?.length) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {news.tags!.map(t => (
                      <Link key={t} href={`/news?tag=${encodeURIComponent(t)}`} className="text-sm text-[#029cda]">
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 text-sm text-[#6b7280]">
                  <button
                    className="p-2 rounded-lg hover:bg-[#f2f3f7]"
                    title="Оставить комментарий"
                    onClick={handleComment}
                  >
                    <Image src="/icons/comments.svg" alt="Комментарии" width={30} height={30} className="object-contain" />
                  </button>
                  <button
                    className={`p-2 rounded-lg hover:bg-[#f2f3f7] ${isFavorite ? 'text-red-500' : ''}`}
                    title={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                    onClick={handleFavorite}
                    disabled={loading}
                  >
                    <Image src="/icons/favorite.svg" alt="Избранное" width={30} height={30} className="object-contain" />
                  </button>
                  <div className="text-[#676E7E] text-sm font-medium">
                    {formatContentDate(news.createdAt, news.updatedAt)}
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Image src="/icons/views.svg" alt="Просмотры" width={20} height={20} className="object-contain" />
                    <span>{views}</span>
                  </div>
                </div>
              </section>

              <CommentSection postId={news.id} postType="news" />
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          if (news) {
            sb_isFavorite(news.id, 'news').then(setIsFavorite).catch(console.error);
          }
        }}
      />
    </div>
  );
}
