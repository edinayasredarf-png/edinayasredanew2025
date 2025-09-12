import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Временный статический массив для отображения примера
const blogPosts = [
  {
    href: 'https://dzen.ru/a/aGfGYs-LVjjlhop4',
    image: '/img/blog1.svg',
    date: '4 июля',
    title: 'Одна идея и 1 097 км, ради встречи с Путиным!',
    description: 'Краткое описание поста или превью для SEO и карточки.',
  },
  {
    href: 'https://dzen.ru/a/aGOYsFVgPE4_qbqA',
    image: '/img/blog2.svg',
    date: '1 июля',
    title: 'Новый шаг в сохранении памяти: сервис MyRoots интеграция с Единой средой.',
    description: 'Краткое описание поста или превью для SEO и карточки.',
  },
  {
    href: 'https://dzen.ru/a/aEZ3Pb24O0UJkLch',
    image: '/img/blog3.svg',
    date: '9 июня',
    title: 'Единая Cреда и Startup Village 2025',
    description: 'Краткое описание поста или превью для SEO и карточки.',
  },
];

const SectionBlog = () => {
  const latestPosts = blogPosts.slice(0, 3);
  return (
    <section className="py-10 lg:py-20">
      <div className="max-w-[1480px] mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 lg:mb-12">
          <h2 className="text-center text-black text-2xl md:text-4xl lg:text-[50px] font-medium leading-[1.1] mb-0">
            Блог
          </h2>
          <p className="text-lg text-gray-400 max-w-md md:text-right mt-4 md:mt-0">
            Новости и статьи о цифровизации и эффективном управлении территориями
          </p>
        </div>
        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
          {latestPosts.map((post, idx) => (
            <a
              key={post.href}
              href={post.href}
              target="_blank"
              rel="noopener"
              className="group bg-white rounded-3xl p-2.5 flex flex-col h-full transition-all duration-300 outline outline-1 outline-transparent border border-transparent hover:outline-[#0077FF]"
            >
              <Image
                src={post.image}
                alt={post.title}
                width={400}
                height={220}
                className="rounded-2xl w-full h-auto object-cover mb-4"
              />
              <div className="px-4 pb-4 flex flex-col flex-grow">
                <p className="text-gray-500 text-base mb-2">{post.date}</p>
                <h3 className="text-xl font-bold text-black mb-6 flex-grow">{post.title}</h3>
                <span className="inline-flex items-center justify-center self-start px-6 py-3 bg-[#F6F7F9] text-black text-lg font-medium rounded-xl border border-transparent group-hover:outline-1 group-hover:outline-[#0077FF]">
                  Подробнее
                </span>
              </div>
            </a>
          ))}
        </div>
        {/* Read More Button */}
        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center w-full px-8 py-4 bg-white text-[#0077FF] text-lg font-medium rounded-xl hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-[#F1F2F4] hover:text-[#0077FF]"
          >
            Читать ещё
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SectionBlog;