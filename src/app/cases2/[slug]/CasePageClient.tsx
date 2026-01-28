'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';
import { sb_getCaseBySlug, sb_listCases, type CaseItem } from '@/lib/blogStore';
import { authStore } from '@/lib/authStore';

type TocItem = { id: string; text: string; level: 2 | 3 };

function parseTocAndInjectIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let index = 0;
  const regex = /<h([23])>([\s\S]*?)<\/h\1>/gi;
  const withIds = html.replace(regex, (_, level, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const id = `section-${index}`;
    toc.push({ id, text, level: level === '2' ? 2 : 3 });
    index++;
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: withIds, toc };
}

export default function CasePageClient({ slug }: { slug?: string }) {
  const params = useParams();
  const router = useRouter();
  const routeSlug = params?.slug as string;
  const effectiveSlug = slug || routeSlug;
  const modal = useModal() as any;

  const [caseData, setCaseData] = useState<CaseItem | null>(null);
  const [relatedCases, setRelatedCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setIsEditor(authStore.canWriteArticles());
    });
    setIsEditor(authStore.canWriteArticles());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!effectiveSlug) return;

    (async () => {
      try {
        setLoading(true);
        const data = await sb_getCaseBySlug(effectiveSlug);
        setCaseData(data || null);

        const allCases = await sb_listCases();
        const related = allCases.filter((c) => c.slug !== effectiveSlug).slice(0, 3);
        setRelatedCases(related);
      } catch (error) {
        console.error('Ошибка загрузки кейса:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [effectiveSlug]);

  const { html: contentWithIds, toc } = useMemo(
    () => parseTocAndInjectIds(caseData?.contentHtml ?? ''),
    [caseData?.contentHtml]
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openRequest = () => {
    if (typeof modal?.openSolutionRequest === 'function') {
      modal.openSolutionRequest();
    } else if (typeof modal?.openConsult === 'function') {
      modal.openConsult();
    }
  };

  const handleDelete = async () => {
    if (!caseData || !confirm('Удалить кейс?')) return;
    try {
      const { sb_deleteCaseById } = await import('@/lib/blogStore');
      await sb_deleteCaseById(caseData.id);
      router.push('/cases2');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить кейс');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-[#F6F7F9] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0077FF] mx-auto mb-4" />
            <p className="text-gray-600">Загрузка кейса...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="bg-[#F6F7F9] min-h-screen">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8 py-16 text-center">
            <div className="text-gray-400 text-6xl mb-6">🔍</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Кейс не найден</h1>
            <p className="text-gray-600 mb-8">Возможно, кейс был удалён или ссылка неверна</p>
            <Link
              href="/cases2"
              className="inline-flex items-center gap-2 bg-[#0077FF] text-white px-6 py-3 rounded-xl hover:bg-[#0077FF]/90 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Вернуться к кейсам
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-[#F6F7F9] min-h-screen font-[Raleway] font-medium lining-nums">
        <section className="bg-white text-[#19191a] rounded-b-[20px] relative overflow-hidden">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8 py-10 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-7">
                <Link
                  href="/cases2"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-sm md:text-base text-[#212121] hover:bg-[#ECEFF3] transition-colors"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Назад к кейсам
                </Link>

                <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl font-medium leading-tight">
                  {caseData.title}
                </h1>
                {caseData.subtitle && (
                  <p className="mt-6 text-xl md:text-2xl text-gray-600">
                    {caseData.subtitle}
                  </p>
                )}

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={openRequest}
                    className="bg-[#0077FF] text-white font-semibold px-6 py-4 rounded-xl hover:bg-[#0077FF]/90 transition-colors text-base md:text-lg"
                  >
                    Запросить похожее решение
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F6F7F9]">
                  <Image
                    src={caseData.cover || '/img/cases/case1.png'}
                    alt={caseData.title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-[1480px] mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
            <article className="space-y-10">
              <section className="bg-white rounded-3xl p-6 md:p-8">
                <div
                  className="prose prose-lg max-w-none text-[#313131] article-content article-toc-targets"
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />
                <style jsx global>{`
                  .prose img, .prose video, .prose iframe { max-width: 100%; height: auto; border-radius: 16px; margin-bottom: 1.4rem; margin-top: 1.2rem; }
                  .prose figure { text-align: center; margin-bottom: 1.4rem; }
                  .prose figcaption { color:#6b7280; font-size:14px; margin-top:6px; margin-bottom: 1.4rem; }
                  .prose blockquote { border-left:4px solid #e1e2e5; padding:8px 12px; border-radius:8px; color:#374151; margin-bottom: 1.4rem; margin-top: 1.4rem; }
                  .article-toc-targets h2, .article-toc-targets h3 { scroll-margin-top: 1.5rem; }
                  .prose h2 { font-size: 1.8rem; line-height: 1.3; margin-bottom: 1.4rem; font-weight: 700; }
                  .prose h3 { font-size: 1.25rem; line-height: 1.35; margin-top: 1.2rem; margin-bottom: 1.4rem; font-weight: 600; }
                  .prose p { margin-bottom: 1rem; line-height: 1.75; }
                  .prose ul, .prose ol { margin-bottom: 1rem; padding-left: 1.5rem; }
                  .prose li { margin-bottom: 0.5rem; }
                  .article-content { direction: ltr; }
                `}</style>

                {isEditor && (
                  <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-3">
                    <Link
                      href={`/blog/new?edit=${encodeURIComponent(caseData.slug)}&type=case`}
                      className="h-10 px-4 rounded-lg bg-[#313131] text-white hover:bg-[#444] text-sm flex items-center transition-colors"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={handleDelete}
                      className="h-10 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </section>
            </article>

            <aside className="lg:pl-2">
              <div className="bg-white rounded-3xl p-6 md:p-8 sticky top-6">
                <h3 className="text-xl md:text-2xl font-semibold text-black">Содержание</h3>
                {toc.length > 0 ? (
                  <nav className="mt-4 space-y-2 text-gray-800" aria-label="Содержание статьи">
                    {toc.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollToSection(item.id)}
                        className={`block w-full text-left hover:text-[#0077FF] text-base md:text-lg transition-colors ${item.level === 3 ? 'pl-3' : ''}`}
                      >
                        {item.text}
                      </button>
                    ))}
                  </nav>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">В статье нет заголовков h2/h3</p>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500 mb-4">Интересует похожее решение?</div>
                  <button
                    onClick={openRequest}
                    className="w-full bg-[#0077FF] text-white font-semibold py-3.5 rounded-xl text-base hover:bg-[#0077FF]/90 transition-colors"
                  >
                    Запросить консультацию
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {relatedCases.length > 0 && (
          <section className="max-w-[1480px] mx-auto px-5 md:px-8 pb-14">
            <h3 className="text-center text-2xl md:text-4xl text-black font-semibold">Читайте ещё</h3>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedCases.map((item) => (
                <Link
                  key={item.id}
                  href={`/cases2/${item.slug}`}
                  className="bg-white rounded-3xl p-6 hover:ring-1 hover:ring-[#0077FF] transition"
                >
                  <div className="w-full h-64 rounded-xl bg-[#F6F7F9] overflow-hidden flex items-center justify-center relative">
                    {item.cover ? (
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">📁</div>
                    )}
                  </div>
                  <div className="mt-2 text-xl md:text-2xl text-[#313131] leading-snug font-semibold">
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="mt-3 text-sm md:text-base text-gray-600 line-clamp-3">
                      {item.subtitle}
                    </div>
                  )}
                  <div className="mt-6 inline-flex px-5 py-3.5 rounded-xl bg-[#F2F2F2] hover:bg-[#ECECEC] transition text-[#313131] text-base md:text-lg">
                    Читать кейс
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="max-w-[1480px] mx-auto px-5 md:px-8 pb-16">
          <div className="bg-white rounded-[20px] p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-semibold text-black">
              Готовы реализовать похожий проект?
            </h2>
            <p className="mt-4 text-lg md:text-xl text-gray-700">
              Свяжитесь с нами для обсуждения ваших задач и получения персонального предложения
            </p>
            <div className="mt-8">
              <button
                onClick={openRequest}
                className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-semibold text-base md:text-lg hover:bg-[#0077FF]/90 transition-colors"
              >
                Запросить консультацию
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

