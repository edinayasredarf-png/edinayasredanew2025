'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeftNav from '@/components/blog/LeftNav';
import RightSidebar from '@/components/blog/RightSidebar';
import TopBar from '@/components/blog/TopBar';
import {
  NewsItem,
  getNewsBySlug,
  react,
  myReactions,
  auth,
  deleteNewsById,
} from '@/lib/blogStore';
import { sb_getNewsBySlug, sb_incViews, sb_deleteNewsById } from '@/lib/blogStore';

export default function NewsPageClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem | undefined>();
  const [mine, setMine] = useState<string[]>([]);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => { setIsAuthed(auth.isAuthed()); }, []);

  useEffect(() => {
    if (!slug) return;
    (async ()=>{
      const n = await sb_getNewsBySlug(slug).catch(()=>undefined) || getNewsBySlug(slug);
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

  const rx = news.reactions || { heart: 0, fire: 0, smile: 0 };

  const doDelete = async () => {
    if (!confirm('Удалить новость?')) return;
    try {
      await sb_deleteNewsById(news.id);
    } catch {
      deleteNewsById(news.id);
    }
    router.push('/news');
  };

  const handleReact = (type: 'heart' | 'fire' | 'smile') => {
    if (!news) return;
    react('news', news.id, type);
    setMine(myReactions(news.id));
    // Refresh news data to get updated reactions
    const updatedNews = getNewsBySlug(news.slug);
    if (updatedNews) {
      setNews(updatedNews);
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
                <div className="flex items-center gap-2">
                  <Link
                    href="/news"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-[#111] hover:bg-[#ECEFF3]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Назад к новостям
                  </Link>
                  <Link href="/blog" className="h-9 px-3 rounded-lg bg-[#111] text-white hover:bg-[#333] text-sm flex items-center ml-auto">
                    К статьям
                  </Link>

                  {isAuthed && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/blog/new/index.html?edit=${encodeURIComponent(news.slug)}&type=news`}
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
                  <div className="ml-auto text-[#52555a]">👁 {news.views || 0}</div>
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
