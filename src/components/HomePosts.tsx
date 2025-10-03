'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost, sb_listPosts } from '@/lib/blogStore';

export default function HomePosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await sb_listPosts();
        // Исключаем кейсы из блока «Последние статьи» на главной
        setPosts(all.filter(p => (p.kind || 'post') !== 'case').slice(0, 3));
      } catch (e) {
        setPosts([]);
      }
    })();
  }, []);

  if (!posts.length) return null;

  return (
    <section className="py-10 lg:py-20">
      <div className="max-w-[1480px] mx-auto px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 lg:mb-12">
          <h2 className="text-center text-black text-2xl md:text-4xl lg:text-[50px] font-medium leading-[1.1] mb-0">
            Блог
          </h2>
          <p className="text-lg text-gray-400 max-w-md md:text-right mt-4 md:mt-0">
            Последние статьи нашей команды
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group bg-white rounded-3xl p-2.5 flex flex-col h-full transition-all duration-300 border border-[#E5E7EB] hover:border-[#0077FF]"
            >
              <div className="rounded-2xl w-full h-auto object-cover mb-4 overflow-hidden">
                <Image
                  src={p.cover || '/img/blog1.svg'}
                  alt={p.title}
                  width={400}
                  height={220}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="px-4 pb-4 flex flex-col flex-grow">
                <p className="text-gray-500 text-base mb-2">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</p>
                <h3 className="text-xl font-bold text-black mb-6 flex-grow">{p.title}</h3>
                <span className="inline-flex items-center justify-center self-start px-6 py-3 bg-[#F6F7F9] text-black text-lg font-medium rounded-xl border border-transparent group-hover:outline-1 group-hover:outline-[#0077FF]">
                  Подробнее
                </span>
              </div>
            </Link>
          ))}
        </div>

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
}


