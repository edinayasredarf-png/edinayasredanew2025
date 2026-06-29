'use client';

import React, { useEffect, useState } from 'react';
import '@/styles/article-content.css';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
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
import PostActionBar from '@/components/blog/PostActionBar';
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
  const [commentsCount, setCommentsCount] = useState(0);
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

  // SEO на клиенте (на случай, если серверные метаданные не применились)
  useEffect(() => {
    if (!post?.title) return;
    document.title = `${post.title} | Единая среда`;
    const desc = (post.subtitle || '').trim();
    if (desc) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', desc);
    }
  }, [post?.title, post?.subtitle]);

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
      <div className="bg-[#f5f6f8] min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 pb-16 font-[Raleway]">
          <div className="flex gap-4">
            <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />
            <main className="flex-1 min-w-0 flex items-center justify-center min-h-[60vh]">
              <div className="w-full max-w-[760px] space-y-4 animate-pulse">
                <div className="h-8 bg-[#e4e7ec] rounded-xl w-3/4" />
                <div className="h-56 bg-[#e4e7ec] rounded-2xl w-full" />
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-4 bg-[#e4e7ec] rounded-lg" style={{ width: `${100 - i * 5}%` }} />
                  ))}
                </div>
              </div>
            </main>
            <RightSidebar />
          </div>
        </div>
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
    <div className="bg-[#f5f6f8] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 pb-16 font-[Raleway]">
        <div className="flex gap-4">
          <LeftNav activeTab={activeTab} onTabChange={handleTabChange} />
          <main className="flex-1 min-w-0">

            {/* Карточка статьи — такой же размер и подложка как PostCard */}
            <article className="bg-white rounded-2xl border border-[#e8eaed] overflow-hidden">

              {/* Заголовок */}
              <div className="px-5 pt-5">
                <h1 className="text-[20px] font-bold text-[#1a1a1a] leading-[1.25]">{post.title}</h1>
              </div>

              {/* Подзаголовок */}
              {post.subtitle && (
                <div className="px-5 pt-2">
                  <p className="text-[14px] text-[#52555a] leading-relaxed">{post.subtitle}</p>
                </div>
              )}

              {/* Теги */}
              {!!(post.tags?.length) && (
                <div className="px-5 pt-2.5 flex flex-wrap gap-1.5">
                  {post.tags!.map(t => (
                    <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`}
                      className="text-[12px] text-[#029cda] hover:text-[#0280b5] bg-[#f0faff] px-2.5 py-0.5 rounded-full transition-colors">
                      #{t}
                    </Link>
                  ))}
                </div>
              )}

              {/* Обложка */}
              {post.cover && (
                <div className="mt-3 mx-5">
                  <div className="w-full aspect-[16/9] rounded-xl overflow-hidden relative bg-[#f2f3f7]">
                    <Image src={post.cover} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 660px" />
                  </div>
                </div>
              )}

              {/* Дата */}
              <div className="px-5 pt-2 flex justify-between items-center">
                <span className="text-[12px] text-[#8c9099]">{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                <div className="flex items-center gap-1 text-[12px] text-[#8c9099]">
                  <Image src="/icons/views.svg" alt="" width={14} height={14} className="object-contain opacity-60" />
                  {views > 0 && <span>{views}</span>}
                </div>
              </div>

              {/* Разделитель */}
              <div className="mx-5 mt-4 h-px bg-[#e8eaed]" />

              {/* Контент статьи */}
              <div className="px-5 py-5">
                <div className="article-content max-w-none text-[#313131] font-[Raleway]"
                  dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
              </div>

              {/* Кнопки редактора */}
              {isEditor && (
                <div className="px-5 pb-4 flex items-center gap-2 justify-end">
                  <Link href={`/blog/new?edit=${encodeURIComponent(post.slug)}&type=post`}
                    className="h-9 px-3 rounded-lg bg-[#313131] text-white hover:bg-[#333] text-[13px] flex items-center">
                    Редактировать
                  </Link>
                  <button onClick={doDelete} className="h-9 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 text-[13px]">
                    Удалить
                  </button>
                </div>
              )}

              {/* Комментарии */}
              <div className="h-px bg-[#e8eaed]" />
              <div className="px-5 py-5">
                <CommentSection postId={post.id} postType="post" onCountChange={setCommentsCount} />
              </div>
            </article>

            {/* Читайте ещё */}
            {more.length > 0 && (
              <section className="mt-3">
                <h3 className="text-[17px] font-bold text-[#313131] mb-3">Читайте ещё</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {more.map(m => (
                    <Link key={m.id} href={`/blog/${m.slug}`}
                      className="bg-white rounded-2xl border border-[#e8eaed] p-4 hover:border-[#029cda] transition block">
                      <div className="w-full aspect-[16/10] rounded-xl bg-[#f2f3f7] overflow-hidden relative">
                        <Image src={m.cover || 'https://placehold.co/400x225'} alt={m.title} fill
                          className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                      </div>
                      <div className="mt-2 text-[12px] text-[#8c9099]">
                        {new Date(m.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="text-[15px] font-semibold text-[#313131] leading-snug mt-1">
                        {m.title}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </main>
          <RightSidebar />
        </div>
      </div>

      <PostActionBar
        postId={post.id}
        postType="post"
        commentsCount={commentsCount}
        initialReactions={post.reactions}
        onCommentClick={handleComment}
        onAuthRequired={() => setShowAuthModal(true)}
      />

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
