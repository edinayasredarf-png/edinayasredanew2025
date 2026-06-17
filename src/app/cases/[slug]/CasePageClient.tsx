'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { CaseDetailSidebar } from '@/components/redesign/cases/CaseDetailSidebar';
import { useModal } from '@/components/ModalProvider';
import { sb_getCaseBySlug, sb_listCases, type CaseItem } from '@/lib/blogStore';
import { authStore } from '@/lib/authStore';
import { htmlInnerTextToPlain } from '@/lib/htmlText';
import {
  estimateReadingMinutes,
  resolveCaseCover,
  stripLeadingCoverMedia,
} from '@/lib/caseCover';
import { normalizeCaseContentHtml } from '@/lib/caseContentHtml';
import '@/styles/redesign.css';
import '@/styles/case-detail.css';
import '@/styles/article-content.css';

type TocItem = { id: string; text: string; level: 2 | 3 };

function parseTocAndInjectIds(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let index = 0;
  const regex = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  const withIds = html.replace(regex, (_, level, attrs, inner) => {
    const text = htmlInnerTextToPlain(inner);
    const id = `section-${index}`;
    toc.push({ id, text, level: level === '2' ? 2 : 3 });
    index++;
    const existingId = /id="[^"]*"/.test(attrs);
    const newAttrs = existingId ? attrs.replace(/id="[^"]*"/, `id="${id}"`) : ` id="${id}"${attrs}`;
    return `<h${level}${newAttrs}>${inner}</h${level}>`;
  });
  return { html: withIds, toc };
}

function formatCaseDate(ts: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(ts));
}

export default function CasePageClient({ slug }: { slug?: string }) {
  const params = useParams();
  const router = useRouter();
  const routeSlug = params?.slug as string;
  const effectiveSlug = slug || routeSlug;
  const modal = useModal() as { openSolutionRequest?: () => void; openConsult?: () => void };

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
    if (!caseData) return;
    document.title = caseData.title ? `${caseData.title} | Единая Среда` : 'Кейс | Единая Среда';
    if (caseData.subtitle) {
      const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (meta) meta.content = caseData.subtitle;
    }
  }, [caseData?.title, caseData?.subtitle]);

  useEffect(() => {
    if (!effectiveSlug) return;
    (async () => {
      try {
        setLoading(true);
        const data = await sb_getCaseBySlug(effectiveSlug);
        setCaseData(data || null);
        const allCases = await sb_listCases();
        setRelatedCases(allCases.filter((c) => c.slug !== effectiveSlug).slice(0, 3));
      } catch (error) {
        console.error('Ошибка загрузки кейса:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [effectiveSlug]);

  const coverUrl = useMemo(
    () => (caseData ? resolveCaseCover(caseData.cover, caseData.contentHtml) : ''),
    [caseData],
  );

  const bodyHtmlRaw = useMemo(() => {
    if (!caseData?.contentHtml) return '';
    const withoutCover = stripLeadingCoverMedia(caseData.contentHtml, coverUrl);
    return normalizeCaseContentHtml(withoutCover);
  }, [caseData?.contentHtml, coverUrl]);

  const { html: contentWithIds, toc } = useMemo(
    () => parseTocAndInjectIds(bodyHtmlRaw),
    [bodyHtmlRaw],
  );

  const readMinutes = useMemo(() => estimateReadingMinutes(bodyHtmlRaw), [bodyHtmlRaw]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openRequest = () => {
    if (typeof modal?.openSolutionRequest === 'function') modal.openSolutionRequest();
    else if (typeof modal?.openConsult === 'function') modal.openConsult();
  };

  const handleDelete = async () => {
    if (!caseData || !confirm('Удалить кейс?')) return;
    try {
      const { sb_deleteCaseById } = await import('@/lib/blogStore');
      await sb_deleteCaseById(caseData.id);
      router.push('/cases');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить кейс');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#029cda] mx-auto mb-4" />
            <p className="text-[#667085] font-inter">Загрузка кейса…</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!caseData) {
    return (
      <Layout>
        <div className="case-page-column py-20 text-center">
          <h1 className="text-3xl font-medium text-[#101828] case-detail-title">Кейс не найден</h1>
          <p className="mt-4 text-[#667085]">Возможно, кейс был удалён или ссылка неверна</p>
          <Link
            href="/cases"
            className="inline-flex mt-8 bg-[#029cda] text-white px-6 py-3 rounded-lg hover:bg-[#0288bd] transition-colors"
          >
            Вернуться к кейсам
          </Link>
        </div>
      </Layout>
    );
  }

  const tags = [
    { label: 'Единая среда', href: '/' },
    ...(caseData.application ? [{ label: caseData.application, href: '/cases' as const }] : []),
  ];

  return (
    <Layout>
      <article>
        {/* Hero */}
        <section className="page-hero pb-10 md:pb-14 w-full">
          <div className="case-page-column pt-8 md:pt-[30px]">
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 text-sm text-[#6d7885] hover:text-[#202020] mb-6 font-inter"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Все кейсы
            </Link>

            <h1 className="case-detail-title font-involve text-[clamp(2rem,5vw,3.6rem)] leading-[1.15] md:leading-[72px] text-black">
              {caseData.title}
            </h1>

            {caseData.subtitle && (
              <p className="mt-4 md:mt-6 text-[17px] leading-7 text-[#2c2d2e] font-inter max-w-3xl">
                {caseData.subtitle}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.label}
                  href={tag.href}
                  className="inline-flex px-3 py-1.5 rounded-lg bg-[#e1e3e6] text-sm font-medium text-[#6d7885] font-inter hover:bg-[#d5d8dc] transition-colors"
                >
                  {tag.label}
                </Link>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 md:gap-8 text-[#2c2d2e] font-inter text-sm md:text-[15px]">
              <span className="inline-flex items-center gap-2">
                <CalendarIcon />
                {formatCaseDate(caseData.createdAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <ClockIcon />
                Читать {readMinutes} мин
              </span>
            </div>

            <div className="mt-8 md:mt-10 relative w-full aspect-[1120/550] max-h-[min(55vw,550px)] rounded-3xl overflow-hidden bg-[#e1e3e6]">
              <Image
                src={coverUrl}
                alt={caseData.title}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1120px) 100vw, 1120px"
              />
            </div>
          </div>
        </section>

        {/* Контент + сайдбар */}
        <section className="pb-16 md:pb-24 w-full">
          <div className="case-page-column">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,650px)_minmax(280px,358px)] gap-10 lg:gap-[112px] lg:justify-between">
              <div className="min-w-0">
                <div
                  className="case-detail-content article-content article-toc-targets"
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />

                {isEditor && (
                  <div className="mt-10 pt-6 border-t border-[#e4e7ec] flex flex-wrap gap-3">
                    <Link
                      href={`/blog/new?edit=${encodeURIComponent(caseData.slug)}&type=case`}
                      className="h-10 px-4 rounded-lg bg-[#202020] text-white text-sm flex items-center hover:bg-[#333]"
                    >
                      Редактировать
                    </Link>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="h-10 px-4 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                    >
                      Удалить
                    </button>
                  </div>
                )}

                {/* CTA в тексте */}
                <div className="case-detail-cta">
                  <p className="case-detail-title font-involve text-xl md:text-[26.9px] leading-9 text-[#2c2d2e]">
                    Свяжитесь с нами! Покажем, как это реализовать в вашем регионе
                  </p>
                  <button
                    type="button"
                    onClick={openRequest}
                    className="mt-6 inline-flex h-9 items-center justify-center px-5 rounded-lg bg-[#029cda] text-white text-sm font-medium font-inter hover:bg-[#0288bd] transition-colors"
                  >
                    Получить консультацию
                  </button>
                </div>
              </div>

              <CaseDetailSidebar
                toc={toc}
                onTocClick={scrollToSection}
                onRequest={openRequest}
                related={relatedCases}
              />
            </div>
          </div>
        </section>
      </article>
    </Layout>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5 text-[#99a2ad]" viewBox="0 0 20 28" fill="none" aria-hidden>
      <path
        d="M2 10h16M6 2v4M14 2v4M3 6h14a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5 text-[#99a2ad]" viewBox="0 0 20 28" fill="none" aria-hidden>
      <circle cx="10" cy="14" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 11v4l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
