'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import Link from 'next/link';
import Image from 'next/image';
import { useModal } from '@/components/ModalProvider';
import { sb_listCases } from '@/lib/blogStore';

type DynCase = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover?: string;
  createdAt: number;
};

export default function Cases2Page() {
  const { openConsult } = useModal();
  const [items, setItems] = useState<DynCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cases = await sb_listCases();
        const dyn = (cases || [])
          .sort((a,b) => b.createdAt - a.createdAt)
          .map(c => ({ id: c.id, slug: c.slug, title: c.title, description: c.subtitle || '', cover: c.cover, createdAt: c.createdAt }));
        setItems(dyn);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout>
      <div className="bg-[#F6F7F9] min-h-screen">
        {/* Hero */}
        <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[320px]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl md:text-[64px] font-medium leading-tight">Кейсы 2</h1>
                <p className="mt-6 text-lg sm:text-xl text-grey-92 max-w-2xl">Динамические кейсы из редактора</p>
                <div className="mt-8">
                  <button onClick={openConsult} className="inline-flex items-center justify-center bg-[#0077FF] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none">Получить консультацию</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-[1480px] mx-auto px-5 md:px-8 py-8">
          {loading ? (
            <div className="text-center py-20 text-gray-600">Загрузка…</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-6">🗂</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Кейсы не найдены</h3>
              <p className="text-gray-600 mb-8">Создайте первый кейс в редакторе</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {items.map((it, index) => {
                const isWide = (index + 1) % 5 === 0;
                return (
                  <Link key={it.id} href={`/cases2/${it.slug}`} className={`group ${isWide ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : ''}`}>
                    <div className="bg-white rounded-2xl p-2 flex h-full transition-all duration-300 border border-[#E5E7EB] hover:border-[#0077FF]">
                      <div className={`bg-[#F6F7F9] rounded-xl p-4 flex flex-col ${isWide ? 'md:flex-row' : ''} h-full items-stretch relative overflow-hidden min-h-[420px] ${isWide ? 'md:min-h-[360px]' : ''}`}>
                        <div className={`w-full mb-4 ${isWide ? 'md:w-1/2 md:flex md:justify-center md:items-center md:ml-4 md:order-2' : ''}`}>
                          <div className={`relative w-full h-auto rounded-xl flex items-center justify-center overflow-hidden ${isWide ? 'md:w-full md:h-auto' : ''}`}>
                            <img src={it.cover || '/img/cases/case1.png'} alt={it.title} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className={`flex flex-col justify-between flex-1 ${isWide ? 'md:w-1/2 md:order-1' : ''}`}>
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="bg-[#0077FF] text-white px-2 py-1 rounded-lg text-xs font-medium">Кейс</span>
                            </div>
                            <h3 className={`text-xl font-bold text-black leading-tight mb-3 ${isWide ? 'md:text-2xl' : ''}`}>{it.title}</h3>
                            <p className={`text-sm text-gray-600 mb-4 line-clamp-2 ${isWide ? 'md:text-base md:line-clamp-3' : ''}`}>{it.description}</p>
                          </div>
                          <div className="mt-auto">
                            <span className="group inline-flex items-center justify-center w-12 h-12 bg-white rounded-lg border border-transparent group-hover:border-[#0077FF] transition-all duration-300">
                              <svg className="w-5 h-5 text-black group-hover:text-[#0077FF] transition-colors duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.43 5.92999L20.5 12L14.43 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="bg-[#F6F7F9] py-16">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Готовы реализовать похожий проект?</h2>
              <p className="text-xl text-gray-600 mb-8">Свяжитесь с нами для обсуждения ваших задач и получения персонального предложения</p>
              <button onClick={openConsult} className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#0077FF]/90 transition-colors">Получить консультацию</button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}


