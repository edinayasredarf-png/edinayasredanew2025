'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost, sb_listPosts } from '@/lib/blogStore';

let _homePostsCache: BlogPost[] | null = null;

export default function HomePosts() {
  const [posts, setPosts] = useState<BlogPost[]>(_homePostsCache || []);

  useEffect(() => {
    (async () => {
      try {
        const all = await sb_listPosts();
        const filtered = all.filter(p => (p.kind || 'post') !== 'case').slice(0, 3);
        _homePostsCache = filtered;
        // Исключаем кейсы из блока «Последние статьи» на главной
        setPosts(filtered);
      } catch (e) {
        setPosts([]);
      }
    })();
  }, []);

  if (!posts.length) return null;

  return (
    <section className="bg-[#F6F7F9] w-full py-10 md:py-14 lg:py-16 font-[Raleway] lining-nums">
      <div className="rd-content-column">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 lg:mb-12">
          <h2 className="font-involve text-[#313131] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] mb-0">
            Блог
          </h2>
          <p className="text-lg text-[#7C8A9A] font-medium max-w-md md:text-right mt-4 md:mt-0">
					Новости и статьи о цифровизации и эффективном управлении территориями

</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group bg-white rounded-2xl p-2 flex flex-col h-full transition-all duration-300 border border-[#fff] hover:border-[#029cda]"
            >
              <div className="relative rounded-2xl w-full overflow-hidden mb-4">
                {/* Обложка в формате 16:9 */}
                <div className="relative w-full aspect-[16/9]">
                  <Image
                    src={p.cover || '/img/blog1.svg'}
                    alt={p.title}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Дата справа вверху */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <p className="text-[#7C8A9A] text-sm font-medium">
                    {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4 flex flex-col flex-grow">
                <h3 className="text-xl font-medium text-[#313131] mb-6 flex-grow">{p.title}</h3>
                <span className="inline-flex items-center justify-center self-start px-6 py-3 bg-[#F6F7F9] text-[#313131] text-lg font-medium rounded-xl border border-transparent group-hover:outline-1 group-hover:outline-[#029cda]">
                  Подробнее
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center w-full px-8 py-4 bg-[#F6F7F9] text-[#029cda] text-lg font-medium rounded-xl hover:ring-1 hover:ring-[#029cda] hover:ring-offset-2 hover:ring-offset-[#F1F2F4] hover:text-[#029cda]"
          >
            Читать ещё
          </Link>
        </div>
      </div>
    </section>
  );
}


