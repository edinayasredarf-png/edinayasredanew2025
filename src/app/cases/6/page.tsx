'use client';

import React from 'react';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';
import { cases } from '@/data/cases';
import ZoomGallery, { useGallery, GalleryItem } from '@/components/ZoomGallery';

const Case6Inner: React.FC = () => {
  const modal = useModal() as any;
  const { open } = useGallery();

  const openRequest = () => {
    if (typeof modal?.openSolutionRequest === 'function') {
      modal.openSolutionRequest();
    } else if (typeof modal?.openConsult === 'function') {
      modal.openConsult();
    }
  };

  const caseData = {
    id: 6,
    title: 'Самостоятельная инвентаризация кладбищ',
    subtitle: 'г. Суворов, Тульская область',
    client: 'Администрация г. Суворова',
    date: '2024',
    location: 'г. Суворов, Тульская область',
    application: 'Инвентаризация мест захоронений',
    heroImg: '/img/cases/case6/case6_hero.png',
    testimonial: {
      text:
        'Благодаря проекту мы получили полный цифровой реестр захоронений на 6 га кладбищ с бонусным покрытием дополнительной территории. Это значительно упростило управление и планирование.',
      author: 'Администрация г. Суворова',
      position: 'Тульской области',
    },
  };

  // Превью для блока «Читайте ещё»
  const caseImages = [
    '/img/cases/case1.png',
    '/img/cases/case2.png',
    '/img/cases/case3.png',
    '/img/cases/case4.png',
    '/img/cases/case5.png',
    '/img/cases/case6.png',
    '/img/cases/case7.png',
    '/img/cases/case8.png',
    '/img/cases/case9.png',
    '/img/cases/case10.png',
    '/img/cases/case11.png',
    '/img/cases/case12.png',
    '/img/cases/case13.png',
    '/img/cases/case9.png',
  ];

  const related = cases.filter((c) => c.id !== caseData.id).slice(0, 3);

  // Одно изображение (секция «Задача»)
  const singleImage: GalleryItem = {
    src: '/img/cases/case6/case6.png',
    alt: 'Инвентаризация кладбищ — полевые работы в г. Суворов',
  };

  // Три изображения (секция «Решение»)
  const solutionImages: GalleryItem[] = [
    { src: '/img/cases/case6-1.jpg', alt: 'Полевые работы по инвентаризации' },
    { src: '/img/cases/case6-2.jpg', alt: 'Интерфейс цифровой базы данных' },
    { src: '/img/cases/case6-3.jpg', alt: 'Результаты оцифровки кладбищ' },
  ];

  return (
    <>
      {/* HERO */}
      <section className="bg-white text-[#19191a] rounded-b-[20px] relative overflow-hidden">
        <div className="max-w-[1480px] mx-auto px-5 md:px-8 py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <Link
                href="/cases"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F6F7F9] px-4 py-2 text-sm md:text-base text-[#212121] hover:bg-[#ECEFF3] transition-colors"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Назад к кейсам
              </Link>

              <h1 className="mt-6 text-3xl md:text-5xl lg:text-6xl font-medium leading-tight">
                {caseData.title}
              </h1>
              <p className="mt-6 text-xl md:text-2xl text-gray-600">{caseData.subtitle}</p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-base md:text-lg text-gray-700">
                <div>
                  <div className="text-gray-500">Клиент</div>
                  <div className="text-[#19191a]">{caseData.client}</div>
                </div>
                <div>
                  <div className="text-gray-500">Дата проведения</div>
                  <div className="text-[#19191a]">{caseData.date}</div>
                </div>
              </div>

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
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden ">
                <Image
                  src={caseData.heroImg}
                  alt={caseData.title}
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-[1480px] mx-auto px-5 md:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
          {/* LEFT */}
          <article className="space-y-10">
            {/* Задача клиента */}
            <section id="task">
              <h2 className="text-2xl md:text-3xl font-semibold text-black">С какой задачей обратился клиент</h2>
              <p className="mt-4 text-lg md:text-xl leading-relaxed text-gray-800">
                Муниципалитет Суворова планировал инвентаризацию и оцифровку кладбищ общей площадью 5,7 га:
                создать актуальную базу данных, перевести информацию в цифровой формат и оптимизировать
                процессы управления через централизованный реестр.
              </p>

              <figure
                className="group relative mt-6 rounded-2xl overflow-hidden bg-[#F6F7F9] cursor-zoom-in"
                onClick={() => open([singleImage], 0)}
                role="button"
                aria-label="Увеличить изображение"
              >
                <Image
                  src={singleImage.src}
                  alt={singleImage.alt || ''}
                  width={1280}
                  height={800}
                  className="zoom w-full h-auto select-none"
                  priority={false}
                />
                <div className="absolute top-3 right-3 z-20 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-black/55 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110 pointer-events-none">
                  <Image src="/icons/zoom.svg" alt="" width={22} height={22} />
                </div>
              </figure>
            </section>

            {/* Решение */}
            <section id="solution">
              <h2 className="text-2xl md:text-3xl font-semibold text-black">Как мы решили задачу</h2>
              <p className="mt-4 text-lg md:text-xl leading-relaxed text-gray-800">
                Мы выполнили проект «под ключ» с применением АИС «Единая Среда»: наши специалисты провели
                полевые работы и полный сбор сведений по захоронениям на территории 5,7 га.
              </p>
              <p className="mt-4 text-lg md:text-xl leading-relaxed text-gray-800">
                Все данные систематизировали и внесли в цифровой реестр с отображением на ГИС-карте. В рамках
                лояльности дополнительно проинвентаризировали ещё 0,3 га без допзатрат для заказчика.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {solutionImages.map((img, i) => (
                  <figure
                    key={i}
                    className="group relative rounded-2xl overflow-hidden bg-[#F6F7F9] cursor-zoom-in"
                    onClick={() => open(solutionImages, i)}
                    role="button"
                    aria-label={`Увеличить изображение ${i + 1}`}
                  >
                    <Image
                      src={img.src}
                      alt={img.alt || ''}
                      width={800}
                      height={600}
                      className="zoom w-full h-auto select-none"
                    />
                    <div className="absolute top-3 right-3 z-20 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-black/55 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110 pointer-events-none">
                      <Image src="/icons/zoom.svg" alt="" width={20} height={20} />
                    </div>
                  </figure>
                ))}
              </div>
            </section>

            {/* Результат */}
            <section id="result6">
              <h2 className="text-2xl md:text-3xl font-semibold text-black">Результат для клиента</h2>
              <ul className="mt-6 space-y-4 text-lg md:text-xl leading-relaxed text-gray-800">
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[#0077FF] flex-none shrink-0" />
                  <span>
                    <strong>Полный цифровой реестр</strong> — оцифрованы и внесены в систему сведения по{' '}
                    <strong>~6,0 га</strong> (5,7 га + 0,3 га бонус).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[#0077FF] flex-none shrink-0" />
                  <span>
                    <strong>Бонусное покрытие</strong> — дополнительная инвентаризация 0,3 га без допзатрат для
                    заказчика.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[#0077FF] flex-none shrink-0" />
                  <span>
                    <strong>Эффективное управление</strong> — ГИС-карта и структурированные атрибуты упрощают
                    планирование, новые захоронения и обслуживание территорий.
                  </span>
                </li>
              </ul>
            </section>

            {/* Отзыв */}
            <section aria-labelledby="testimonial" className="bg-white rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0077FF] flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 7h4v10H5V9a2 2 0 012-2zm10 0h4v10h-6V9a2 2 0 012-2z" />
                  </svg>
                </div>
                <div>
                  <blockquote id="testimonial" className="text-lg md:text-xl text-gray-700">
                    “{caseData.testimonial.text}”
                  </blockquote>
                  <div className="mt-3">
                    <div className="font-medium text-black">{caseData.testimonial.author}</div>
                    <div className="text-sm text-gray-500">{caseData.testimonial.position}</div>
                  </div>
                </div>
              </div>
            </section>
          </article>

          {/* RIGHT */}
          <aside className="lg:pl-2">
            <div className="bg-white rounded-3xl p-6 md:p-8 sticky top-6">
              <h3 className="text-xl md:text-2xl font-semibold text-black">Содержание</h3>
              <nav className="mt-4 space-y-3 text-gray-800">
                <a href="#task" className="block hover:text-[#0077FF] text-base md:text-lg transition-colors">
                  Задача клиента
                </a>
                <a href="#solution" className="block hover:text-[#0077FF] text-base md:text-lg transition-colors">
                  Решение
                </a>
                <a href="#result6" className="block hover:text-[#0077FF] text-base md:text-lg transition-colors">
                  Результат для клиента
                </a>
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500 mb-2">Тип решения</div>
                <div className="text-base md:text-lg text-gray-700 mb-4">{caseData.application}</div>
                <button
                  onClick={openRequest}
                  className="w-full bg-[#0077FF] text-white font-semibold py-3.5 rounded-xl text-base hover:bg-[#0077FF]/90 transition-colors"
                >
                  Запросить похожее решение
                </button>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* READ MORE */}
      <section className="max-w-[1480px] mx-auto px-5 md:px-8 pb-14">
        <h3 className="text-center text-2xl md:text-4xl text-black">Читайте ещё</h3>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {related.map((m) => (
            <Link
              key={m.id}
              href={`/cases/${m.id}`}
              className="bg-white rounded-3xl p-6 hover:ring-1 hover:ring-[#0077FF] transition"
            >
              <div className="w-full h-64 rounded-xl bg-[#F6F7F9] overflow-hidden flex items-center justify-center">
                <img
                  src={caseImages[(m.id as number) - 1] || caseImages[0]}
                  alt={m.title}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="mt-5 text-sm text-gray-500">{m.industry}</div>
              <div className="mt-2 text-xl md:text-2xl text-[#313131] leading-snug">{m.title}</div>
              <div className="mt-3 text-sm md:text-base text-gray-600 line-clamp-3">{m.description}</div>
              <div className="mt-6 inline-flex px-5 py-3.5 rounded-xl bg-[#F2F2F2] hover:bg-[#ECECEC] transition text-[#313131] text-base md:text-lg">
                Читать кейс
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1480px] mx-auto px-5 md:px-8 pb-16">
        <div className="bg-white rounded-[20px] p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-semibold text-black">Готовы реализовать похожий проект?</h2>
          <p className="mt-4 text-lg md:text-xl text-gray-700">Свяжитесь с нами для обсуждения ваших задач и получения персонального предложения</p>
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
};

const Case6Page: React.FC = () => (
  <Layout>
    <div className="bg-[#F6F7F9] min-h-screen">
      <ZoomGallery>
        <Case6Inner />
      </ZoomGallery>
    </div>
  </Layout>
);

export default Case6Page;
