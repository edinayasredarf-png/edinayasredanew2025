'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import TopBar from '@/components/blog/TopBar';
import {
  BlogPost,
  getPostBySlug,
  listPosts,
  myReactions,
  auth,
  deletePostById,
} from '@/lib/blogStore';
import { sb_getPostBySlug, sb_listPosts, sb_incViews, sb_deletePostById } from '@/lib/blogStore';
import { authStore } from '@/lib/authStore';
import { sb_isFavorite, sb_toggleFavorite } from '@/lib/commentsStore';
import CommentSection from '@/components/blog/CommentSection';
import AuthModal from '@/components/auth/AuthModal';

export default function PostPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | undefined>();
  const [more, setMore] = useState<BlogPost[]>([]);
  const [mine, setMine] = useState<string[]>([]);
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
    
    // Устанавливаем начальное состояние
    setIsEditor(authStore.canWriteArticles());
    setIsAuthenticated(authStore.isAuthenticated());
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleBlogUpdate = () => {
      // Перезагружаем данные при обновлении блога
      if (slug) {
        (async () => {
          const p = await sb_getPostBySlug(slug);
          setPost(p);
          if (p) {
            setMine(myReactions(p.id));
          }
        })();
      }
    };

    window.addEventListener('blogUpdated', handleBlogUpdate);
    return () => window.removeEventListener('blogUpdated', handleBlogUpdate);
  }, [slug]);

  useEffect(() => {
    const handleOpenAuthModal = () => {
      setShowAuthModal(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => window.removeEventListener('openAuthModal', handleOpenAuthModal);
  }, []);

  // Обработка смены вкладок в левом меню
  const handleTabChange = (tab: 'feed' | 'subscriptions' | 'favorites') => {
    setActiveTab(tab);
    
    if (tab === 'favorites') {
      if (!isAuthenticated) {
        // Если пользователь не авторизован, открываем модалку авторизации
        setShowAuthModal(true);
        return;
      }
      // Если авторизован, переходим на страницу блога с вкладкой избранного
      router.push('/blog?tab=favorites');
    } else if (tab === 'feed') {
      // Переходим на главную страницу блога
      router.push('/blog');
    }
    // Для подписок пока ничего не делаем
  };

  useEffect(() => {
    if (!slug) return;
    (async () => {
      // пост
      const p = await sb_getPostBySlug(slug);
      setPost(p);
      if (p) {
        await sb_incViews('post', p.slug);
        setMine(myReactions(p.id));
        
        // Check if post is in favorites
        try {
          const favorite = await sb_isFavorite(p.id, 'post');
          setIsFavorite(favorite);
        } catch (error) {
          console.error('Failed to check favorite status:', error);
        }
      }
      // ещё
      const lp = await sb_listPosts();
      // Не показываем кейсы в блоке «Читайте ещё» для статей
      setMore(lp.filter(x => x.slug !== slug && (x.kind || 'post') !== 'case').slice(0, 4));
    })();
  }, [slug]);

  if (!post) {
    return (
      <div className="bg-[#f2f3f7] min-h-screen">
        <TopBar />
        <section className="max-w-[900px] mx-auto px-5 py-16 text-center">
          <h1 className="text-3xl font-semibold mb-3">Статья не найдена</h1>
          <Link href="/blog" className="text-[#2777ff] hover:underline">Назад к статьям</Link>
        </section>
      </div>
    );
  }

  const views = post.views || 0;

  const share = () => {
    const url = location.href;
    navigator.clipboard.writeText(url);
    alert('Ссылка скопирована');
  };

  const doDelete = async () => {
    if (!confirm('Удалить статью?')) return;
    try {
      await sb_deletePostById(post.id);
    } catch {
      deletePostById(post.id);
    }
    router.push('/blog');
  };

  const handleFavorite = async () => {
    if (!post) return;
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      setLoading(true);
      const newFavoriteStatus = await sb_toggleFavorite(post.id, 'post');
      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      alert('Ошибка при изменении избранного');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
  };

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
                    href="/blog"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-[#111] hover:bg-[#ECEFF3]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Назад к статьям
                  </Link>

                  {isEditor && (
                    <div className="ml-auto flex items-center gap-2">
                      <Link
                        href={`/blog/new?edit=${encodeURIComponent(post.slug)}&type=post`}
                        className="h-9 px-3 rounded-lg bg-[#111] text-white hover:bg-[#333] text-sm flex items-center"
                      >
                        Редактировать
                      </Link>
                      <button onClick={doDelete} className="h-9 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">
                        Удалить
                      </button>
                    </div>
                  )}
                </div>

                <h1 className="mt-4 text-4xl md:text-5xl font-medium leading-tight text-[#111]">{post.title}</h1>
                {post.subtitle && <p className="mt-3 text-xl text-[#52555a]">{post.subtitle}</p>}
                <div className="mt-3 text-[#52555a] text-sm">
                  {new Date(post.createdAt).toLocaleDateString('ru-RU')}
                </div>

                {!!(post.tags?.length) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags!.map(t => (
                      <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="text-sm text-[#2777ff]">
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3 text-sm text-[#6b7280]">
                  {/* Comment icon */}
                  <button 
                    className="p-2 rounded-lg hover:bg-[#f2f3f7]" 
                    title="Оставить комментарий" 
                    onClick={handleComment}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/>
                    </svg>
                  </button>
                  {/* Favorite icon */}
                  <button 
                    className={`p-2 rounded-lg hover:bg-[#f2f3f7] ${isFavorite ? 'text-red-500' : ''}`}
                    title={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                    onClick={handleFavorite}
                    disabled={loading}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M5 3h14a2 2 0 0 1 2 2v16l-9-4-9 4V5a2 2 0 0 1 2-2Z"/>
                    </svg>
                  </button>
                  {/* Views */}
                  <div className="ml-auto flex items-center gap-1">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" stroke="#a4a8b2" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="3" fill="#a4a8b2"/></svg>
                    <span>{views}</span>
                  </div>
                  <button onClick={share} className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-[#111]">
                    Поделиться
                  </button>
                </div>
              </section>

              <section className="mt-6 bg-white rounded-3xl p-6 border">
                <article className="prose prose-lg max-w-none mx-auto text-[#111] article-content" dir="ltr">
                  <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
                </article>
                <style>{`
                  .prose img, .prose video, .prose iframe { max-width: 100%; height: auto; border-radius: 16px; }
                  .prose figure { text-align: center; }
                  .prose figcaption { color:#6b7280; font-size:14px; margin-top:6px; }
                  .prose blockquote { border-left:4px solid #e1e2e5; padding:8px 12px; border-radius:8px; color:#374151; }
                  .prose h2 { font-size: 1.5rem; line-height: 1.3; margin-top: 1.4rem; font-weight: 700; }
                  .prose h3 { font-size: 1.25rem; line-height: 1.35; margin-top: 1.2rem; font-weight: 600; }
                  .article-content { direction: ltr; }
                `}</style>
              </section>

              {more.length > 0 && (
                <section className="mt-10">
                  <h3 className="text-2xl text-[#111]">Читайте ещё</h3>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {more.map(m => (
                      <Link
                        key={m.id}
                        href={`/blog/${m.slug}`}
                        className="bg-white rounded-3xl p-4 border hover:border-[#2777ff] transition block"
                      >
                        <div className="w-full aspect-[16/10] rounded-2xl bg-[#F6F7F9] overflow-hidden border">
                          <img
                            src={m.cover || 'https://placehold.co/400x225'}
                            alt={m.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-2 text-sm text-[#52555a]">
                          {new Date(m.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="text-[16px] font-semibold text-[#111] leading-snug">
                          {m.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Comments Section */}
              <CommentSection postId={post.id} postType="post" />
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
          // Reload favorite status
          if (post) {
            sb_isFavorite(post.id, 'post').then(setIsFavorite).catch(console.error);
          }
        }}
      />
    </div>
  );
}
