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
  react,
  myReactions,
  auth,
  deletePostById,
} from '@/lib/blogStore';
import { sb_getPostBySlug, sb_listPosts, sb_incViews, sb_deletePostById } from '@/lib/blogStore';

export default function PostPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | undefined>();
  const [more, setMore] = useState<BlogPost[]>([]);
  const [mine, setMine] = useState<string[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => { setIsAuthed(auth.isAuthed()); }, []);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      // пост
      const p = await sb_getPostBySlug(slug).catch(()=>undefined) || getPostBySlug(slug);
      setPost(p);
      if (p) {
        await sb_incViews('post', p.slug);
        setMine(myReactions(p.id));
      }
      // ещё
      const lp = await sb_listPosts().catch(()=>listPosts());
      setMore(lp.filter(x => x.slug !== slug).slice(0, 4));
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

  const rx = post.reactions || { heart: 0, fire: 0, smile: 0 };

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

  const handleReact = (type: 'heart' | 'fire' | 'smile') => {
    if (!post) return;
    react('post', post.id, type);
    setMine(myReactions(post.id));
    // Refresh post data to get updated reactions
    const updatedPost = getPostBySlug(post.slug);
    if (updatedPost) {
      setPost(updatedPost);
    }
  };

  return (
    <div className="bg-[#f2f3f7] min-h-screen">
      <TopBar />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-[34px] pt-4 sm:pt-6 pb-8 sm:pb-16">
        <div className="flex flex-col xl:flex-row gap-4 xl:gap-[15px]">
          <LeftNav />
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

                  {isAuthed && (
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

                <div className="mt-4 flex items-center gap-2 text-sm">
                  <button
                    disabled={mine.includes('heart')}
                    onClick={() => handleReact('heart')}
                    className="px-3 py-1.5 rounded-lg bg-[#f2f3f7] hover:bg-[#e9eefb] disabled:opacity-50"
                  >
                    ❤ {rx.heart}
                  </button>
                  <button
                    disabled={mine.includes('fire')}
                    onClick={() => handleReact('fire')}
                    className="px-3 py-1.5 rounded-lg bg-[#f2f3f7] hover:bg-[#e9eefb] disabled:opacity-50"
                  >
                    🔥 {rx.fire}
                  </button>
                  <button
                    disabled={mine.includes('smile')}
                    onClick={() => handleReact('smile')}
                    className="px-3 py-1.5 rounded-lg bg-[#f2f3f7] hover:bg-[#e9eefb] disabled:opacity-50"
                  >
                    🙂 {rx.smile}
                  </button>
                  <div className="ml-auto text-[#52555a]">👁 {post.views || 0}</div>
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
                      <a
                        key={m.id}
                        href={`/b/index.html?s=${encodeURIComponent(m.slug)}`}
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
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
