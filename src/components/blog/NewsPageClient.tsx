'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import TopBar from '@/components/blog/TopBar';
import {
  NewsItem,
  myReactions,
  auth,
  deleteNewsById,
  sb_getNewsBySlug,
  sb_incViews,
  sb_deleteNewsById,
} from '@/lib/blogStore';
import { authStore } from '@/lib/authStore';

export default function NewsPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem | undefined>();
  const [mine, setMine] = useState<string[]>([]);
  const [isEditor, setIsEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'subscriptions' | 'favorites'>('feed');

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setIsEditor(authStore.canWriteArticles());
    });
    
    // Устанавливаем начальное состояние
    setIsEditor(authStore.canWriteArticles());
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleNewsUpdate = () => {
      // Перезагружаем данные при обновлении новостей
      if (slug) {
        (async () => {
          const n = await sb_getNewsBySlug(slug);
          setNews(n);
          if (n) {
            setMine(myReactions(n.id));
          }
        })();
      }
    };

    window.addEventListener('newsUpdated', handleNewsUpdate);
    return () => window.removeEventListener('newsUpdated', handleNewsUpdate);
  }, [slug]);

  useEffect(() => {
    const handleOpenAuthModal = () => {
      // NewsPageClient doesn't have its own auth modal, 
      // but we can trigger the global one
      window.dispatchEvent(new CustomEvent('openAuthModal'));
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  // Обработка смены вкладок в левом меню
  const handleTabChange = (tab: 'feed' | 'subscriptions' | 'favorites') => {
    setActiveTab(tab);
    
    if (tab === 'favorites') {
      // Переходим на страницу блога с вкладкой избранного
      router.push('/blog?tab=favorites');
    } else if (tab === 'feed') {
      // Переходим на главную страницу блога
      router.push('/blog');
    }
    // Для подписок пока ничего не делаем
  };

  useEffect(() => {
    if (!slug) return;
    (async ()=>{
      const n = await sb_getNewsBySlug(slug);
      setNews(n);
      if (n) {
        await sb_incViews('news', n.slug);
        setMine(myReactions(n.id));
      }
    })();
  }, [slug]);

  if (!news) {
    return (
      <div className="bg-[#f2f3f7] min-h-screen">
        <TopBar />
        <section className="max-w-[900px] mx-auto px-5 py-16 text-center">
          <h1 className="text-3xl font-semibold mb-3">Новость не найдена</h1>
          <Link href="/news" className="text-[#2777ff] hover:underline">К новостям</Link>
        </section>
      </div>
    );
  }

  const views = news.views || 0;

  const doDelete = async () => {
    if (!confirm('Удалить новость?')) return;
    try {
      await sb_deleteNewsById(news.id);
      console.log('News deleted from Supabase');
    } catch (error) {
      console.log('Supabase delete failed, using local delete:', error);
      deleteNewsById(news.id);
    }
    // Force refresh the news state
    setNews(undefined);
    router.push('/news');
  };

  // Reactions removed

  return (
    <div className="bg-[#f2f3f7] min-h-screen">
      <TopBar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] pt-4 sm:pt-6 pb-8 sm:pb-16">
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
          <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />
          <main className="flex-1 flex justify-center">
            <div className="w-full max-w-[761px]">
              <section className="bg-white rounded-3xl p-6 border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2">
                  <Link
                    href="/news"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-[#111] hover:bg-[#ECEFF3]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Назад к новостям
                  </Link>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <Link href="/blog" className="h-9 px-3 rounded-lg bg-[#111] text-white hover:bg-[#333] text-sm flex items-center">
                      К статьям
                    </Link>

                    {isEditor && (
                      <>
                        <Link
                          href={`/blog/new?edit=${encodeURIComponent(news.slug)}&type=news`}
                          className="h-9 px-3 rounded-lg bg-[#111] text-white hover:bg-[#333] text-sm flex items-center"
                        >
                          Редактировать
                        </Link>
                        <button onClick={doDelete} className="h-9 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">
                          Удалить
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h1 className="mt-4 text-4xl md:text-5xl font-medium leading-tight text-[#111]">
                  {news.title}
                </h1>
                <div className="mt-3 text-[#52555a] text-sm">
                  {new Date(news.createdAt).toLocaleDateString('ru-RU')}
                </div>
                {!!(news.tags?.length) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {news.tags!.map(t => (
                      <Link key={t} href={`/news?tag=${encodeURIComponent(t)}`} className="text-sm text-[#2777ff]">
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 text-sm text-[#6b7280]">
                  {/* Comment icon */}
                  <button className="p-2 rounded-lg hover:bg-[#f2f3f7]" title="Оставить комментарий" onClick={()=>document.getElementById('comments')?.scrollIntoView({behavior:'smooth'})}>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/></svg>
                  </button>
                  {/* Favorite icon */}
                  <button className="p-2 rounded-lg hover:bg-[#f2f3f7]" title="Добавить в избранное">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3h14a2 2 0 0 1 2 2v16l-9-4-9 4V5a2 2 0 0 1 2-2Z"/></svg>
                  </button>
                  {/* Views */}
                  <div className="ml-auto flex items-center gap-1">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" stroke="#a4a8b2" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="3" fill="#a4a8b2"/></svg>
                    <span>{views}</span>
                  </div>
                </div>
              </section>

              <section className="mt-6 bg-white rounded-3xl p-6 border">
                {news.contentHtml ? (
                  <article className="prose prose-lg max-w-none mx-auto text-[#111] article-content" dir="ltr">
                    <div dangerouslySetInnerHTML={{ __html: news.contentHtml }} />
                  </article>
                ) : (
                  <div className="text-[#111] text-lg">Подробностей нет.</div>
                )}
                <style>{`
                  .prose img, .prose video, .prose iframe { max-width: 100%; height: auto; border-radius: 16px; }
                  .prose figcaption { color:#6b7280; font-size:14px; margin-top:6px; }
                  .prose h2 { font-size: 1.5rem; line-height: 1.3; margin-top: 1.4rem; font-weight: 700; }
                  .prose h3 { font-size: 1.25rem; line-height: 1.35; margin-top: 1.2rem; font-weight: 600; }
                  .article-content { direction: ltr; }
                `}</style>
              </section>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
