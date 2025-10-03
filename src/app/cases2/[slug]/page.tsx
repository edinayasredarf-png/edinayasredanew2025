'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { useModal } from '@/components/ModalProvider';
import ZoomGallery, { useGallery, GalleryItem } from '@/components/ZoomGallery';
import { sb_getCaseBySlug } from '@/lib/blogStore';
import { useRouter } from 'next/navigation';

type Testimonial = {
  text?: string;
  author?: string;
  position?: string;
};

type DynamicCase = {
  slug: string;
  title: string;
  subtitle?: string;
  cover?: string;
  contentHtml: string;
  application?: string;
  heroImg?: string;
  testimonial?: Testimonial;
  solutionImages?: { src: string; alt?: string }[];
};

// ======================== ВНУТРЕННИЙ КОМПОНЕНТ (под ZoomGallery) ========================
function CaseBySlugInner({ slug }: { slug: string }) {
  const modal = useModal() as any;
  const router = useRouter();
  const { open: openGallery } = useGallery();

  const [item, setItem] = useState<DynamicCase | null>(null);
  const [loading, setLoading] = useState(true);
  const articleRef = useRef<HTMLDivElement | null>(null);

  // Показ кнопок редактирования/удаления только админам
  const [canEdit, setCanEdit] = useState(false);
  useEffect(() => {
    const byEnv = process.env.NEXT_PUBLIC_SHOW_EDIT === 'true';
    const byLocal =
      typeof window !== 'undefined' && localStorage.getItem('isAdmin') === '1';
    setCanEdit(Boolean(byEnv || byLocal));
  }, []);

  // URL шаблоны
  const getEditUrl = useCallback((s: string) => {
    const template =
      process.env.NEXT_PUBLIC_CASE_EDIT_URL || '/admin/cases/{slug}/edit';
    return template.replace('{slug}', s);
  }, []);

  const getDeleteEndpoint = useCallback((s: string) => {
    // Эндпоинт API удаления (можно переопределить через ENV)
    const template =
      process.env.NEXT_PUBLIC_CASE_DELETE_ENDPOINT || '/api/cases/{slug}';
    return template.replace('{slug}', s);
  }, []);

  const getBackUrl = useCallback(() => {
    return process.env.NEXT_PUBLIC_CASES_BACK_URL || '/cases2';
  }, []);

  const openRequest = useCallback(() => {
    if (typeof modal?.openSolutionRequest === 'function') {
      modal.openSolutionRequest();
    } else if (typeof modal?.openConsult === 'function') {
      modal.openConsult();
    }
  }, [modal]);

  useEffect(() => {
    (async () => {
      try {
        const c = await sb_getCaseBySlug(slug);
        setItem(c || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Оглавление только из H2, ставим id, если отсутствует
  const [toc, setToc] = useState<{ id: string; text: string }[]>([]);
  useEffect(() => {
    if (!articleRef.current) return;
    const headings = Array.from(articleRef.current.querySelectorAll('h2'));
    const collected = headings.map((h, i) => {
      let id = h.getAttribute('id');
      if (!id) {
        id = `section-${i + 1}`;
        h.setAttribute('id', id);
      }
      return { id, text: h.textContent || `Раздел ${i + 1}` };
    });
    setToc(collected);
  }, [item?.contentHtml]);

  // Делегируем клик по картинкам в контенте -> ZoomGallery
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
    if (imgs.length === 0) return;

    const galleryItems: GalleryItem[] = imgs.map((img) => ({
      src: img.src,
      alt: img.alt || '',
    }));

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const img = target.closest('img');
      if (!img) return;
      const idx = imgs.indexOf(img as HTMLImageElement);
      if (idx >= 0) openGallery(galleryItems, idx);
    };

    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
    };
  }, [item?.contentHtml, openGallery]);

  const handleDelete = useCallback(async () => {
    if (!canEdit) return;
    if (!confirm('Удалить этот кейс? Это действие необратимо.')) return;

    try {
      const res = await fetch(getDeleteEndpoint(slug), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Delete failed with status ${res.status}`);
      }
      router.push(getBackUrl());
    } catch (err) {
      console.error(err);
      alert('Не удалось удалить кейс. Проверьте настройки и права.');
    }
  }, [canEdit, getDeleteEndpoint, slug, router, getBackUrl]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600">
        Загрузка…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-[900px] mx-auto px-5 py-16 text-center">
        <h1 className="text-3xl font-semibold mb-3">Кейс не найден</h1>
        <Link href={getBackUrl()} className="text-[#2777ff] hover:underline">
          Назад к кейсам
        </Link>
      </div>
    );
  }

  const heroTitle = item.title;
  const heroSubtitle = item.subtitle || '';
  const heroImg = item.heroImg || item.cover || '';

  // Для Zoom по клику в hero можно использовать cover как одиночное изображение
  const singleImage: GalleryItem | null = heroImg
    ? { src: heroImg, alt: heroTitle }
    : item.cover
    ? { src: item.cover, alt: heroTitle }
    : null;

  const testimonial = item.testimonial;

  return (
    <>
      {/* HERO */}
      <section className="bg-white text-[#19191a] rounded-b-[20px] relative overflow-hidden">
        <div className="max-w-[1480px] mx-auto px-5 md:px-8 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <Link
                href={getBackUrl()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-sm md:text-base text-[#212121] hover:bg-[#ECEFF3] transition-colors"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Назад к кейсам
              </Link>

              <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl font-medium leading-tight">
                {heroTitle}
              </h1>
              {!!heroSubtitle && (
                <p className="mt-6 text-xl md:text-2xl text-gray-600">{heroSubtitle}</p>
              )}

              {/* БЕЗ «Клиент / Дата проведения» — как просили */}

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={openRequest}
                  className="bg-[#0077FF] text-white font-semibold px-6 py-4 rounded-xl hover:bg-[#0077FF]/90 transition-colors text-base md:text-lg"
                >
                  Запросить похожее решение
                </button>

                {canEdit && (
                  <>
                    <Link
                      href={getEditUrl(slug)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-gray-300 text-[#111] bg-white hover:bg-gray-50 transition-colors text-base md:text-lg"
                      prefetch={false}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
                        <path d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0-4-4L4 16v4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Редактировать
                    </Link>

                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-red-300 text-red-700 bg-white hover:bg-red-50 transition-colors text-base md:text-lg"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Удалить
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F6F7F9] cursor-zoom-in"
                onClick={() => singleImage && openGallery([singleImage], 0)}
                role={singleImage ? 'button' : undefined}
                aria-label={singleImage ? 'Увеличить изображение' : undefined}
              >
                {heroImg ? (
                  <Image
                    src={heroImg}
                    alt={heroTitle}
                    fill
                    priority
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Нет изображения
                  </div>
                )}
                {singleImage && (
                  <div className="absolute top-3 right-3 z-20 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-black/55 backdrop-blur-sm pointer-events-none">
                    <Image src="/icons/zoom.svg" alt="" width={22} height={22} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT — только контент из базы + авто-оглавление по H2 */}
      <section className="max-w-[1480px] mx-auto px-5 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
          {/* LEFT */}
          <article id="details">
            <article
              ref={articleRef}
              className="prose prose-lg max-w-none text-[#111] prose-headings:text-black prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:text-xl md:prose-h3:text-2xl prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-black"
              dir="ltr"
              dangerouslySetInnerHTML={{ __html: item.contentHtml }}
            />
          </article>

          {/* RIGHT — показываем «Содержание» только если есть хотя бы один H2 */}
          {toc.length > 0 && (
            <aside className="lg:pl-2">
              <div className="bg-white rounded-3xl p-6 md:p-8 sticky top-6">
                <h3 className="text-xl md:text-2xl font-semibold text-black">Содержание</h3>
                <nav className="mt-4 space-y-3 text-gray-800">
                  {toc.map((h) => (
                    <a
                      key={h.id}
                      href={`#${h.id}`}
                      className="block hover:text-[#0077FF] text-base md:text-lg transition-colors"
                    >
                      {h.text}
                    </a>
                  ))}
                </nav>

                {/* опционально — тип решения, если оставляете */}
                {item.application && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-2">Тип решения</div>
                    <div className="text-base md:text-lg text-gray-700 mb-1">{item.application}</div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* Отзыв — если есть */}
      {!!testimonial?.text && (
        <section className="max-w-[1480px] mx-auto px-5 md:px-8 pb-8">
          <div className="bg-white rounded-3xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0077FF] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 7h4v10H5V9a2 2 0 012-2zm10 0h4v10h-6V9a2 2 0 012-2z" />
                </svg>
              </div>
              <div>
                <blockquote className="text-lg md:text-xl text-gray-700">“{testimonial.text}”</blockquote>
                <div className="mt-3">
                  {!!testimonial.author && <div className="font-medium text-black">{testimonial.author}</div>}
                  {!!testimonial.position && <div className="text-sm text-gray-500">{testimonial.position}</div>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
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
    </>
  );
}

// ======================== ВНЕШНИЙ КОМПОНЕНТ (оборачивает ZoomGallery) ========================
export default function CaseBySlugPage({ params }: { params: { slug: string } }) {
  return (
    <Layout>
      <div className="bg-[#F6F7F9] min-h-screen">
        <ZoomGallery>
          <CaseBySlugInner slug={params.slug} />
        </ZoomGallery>
      </div>
    </Layout>
  );
}
