"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function DocumentsPage() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  // Описания документов
  const docDescriptions: Record<string, string> = {
    "Выписка из реестра №13314 (1).pdf": "Выписка из реестра №13314.",
    "Политика_оператора_в_отношении_обработки_персональных_данных.pdf": "Политика оператора в отношении обработки персональных данных.",
    "Согласие_на_обработку_данных_СФЕРА.pdf": "Согласие на обработку данных СФЕРА.",
    "Согласие_физ_лица_на_размещение_информации_в_Интернете_СФЕРА.pdf": "Согласие физ. лица на размещение информации в Интернете.",
    "Политика_использования_файлов_кукис_СФЕРА.pdf": "Политика использования файлов кукис СФЕРА.",
    "Политика_обработки_персональных_данных_посетителей_сайта.pdf": "Политика обработки персональных данных посетителей сайта.",
    "Выписка_из_реестра_аккредитованных_организаций (1).pdf": "Выписка из реестра аккредитованных организаций.",
    "rukovodstvo-polzovatelya.pdf": "Руководство пользователя системы Единая Среда.",
  };

  // Названия для отображения
  const docTitles: Record<string, string> = {
    "Выписка из реестра №13314 (1).pdf": "Выписка из реестра №13314 (PDF)",
    "Политика_оператора_в_отношении_обработки_персональных_данных.pdf": "Политика оператора по персональным данным (PDF)",
    "Согласие_на_обработку_данных_СФЕРА.pdf": "Согласие на обработку данных СФЕРА (PDF)",
    "Согласие_физ_лица_на_размещение_информации_в_Интернете_СФЕРА.pdf": "Согласие физ. лица на размещение информации (PDF)",
    "Политика_использования_файлов_кукис_СФЕРА.pdf": "Политика использования файлов кукис (PDF)",
    "Политика_обработки_персональных_данных_посетителей_сайта.pdf": "Политика обработки данных посетителей сайта (PDF)",
    "Выписка_из_реестра_аккредитованных_организаций (1).pdf": "Выписка из реестра аккредитованных организаций (PDF)",
    "rukovodstvo-polzovatelya.pdf": "Руководство пользователя (PDF)",
  };

  // Массив файлов из папки public/docs
  const docFiles = [
    { file: "Выписка из реестра №13314 (1).pdf", title: "Выписка из реестра №13314 (PDF)" },
    { file: "Политика_оператора_в_отношении_обработки_персональных_данных.pdf", title: "Политика оператора по персональным данным (PDF)" },
    { file: "Согласие_на_обработку_данных_СФЕРА.pdf", title: "Согласие на обработку данных СФЕРА (PDF)" },
    { file: "Согласие_физ_лица_на_размещение_информации_в_Интернете_СФЕРА.pdf", title: "Согласие физ. лица на размещение информации (PDF)" },
    { file: "Политика_использования_файлов_кукис_СФЕРА.pdf", title: "Политика использования файлов кукис (PDF)" },
    { file: "Политика_обработки_персональных_данных_посетителей_сайта.pdf", title: "Политика обработки данных посетителей сайта (PDF)" },
    { file: "Выписка_из_реестра_аккредитованных_организаций (1).pdf", title: "Выписка из реестра аккредитованных организаций (PDF)" },
    { file: "rukovodstvo-polzovatelya.pdf", title: "Руководство пользователя (PDF)" },
  ];

  const handleDocClick = (docFile: string) => setActiveDoc(docFile);

  // Безопасно кодируем имя файла для URL (пробелы, скобки и т.д.)
  const encoded = activeDoc ? encodeURIComponent(activeDoc) : null;

  return (
    <div className="min-h-screen bg-white">
      <main className="flex flex-col lg:flex-row w-full max-w-none m-0 pt-4 min-h-screen bg-white">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 bg-[#F6F7F9] rounded-2xl shadow-sm p-6 lg:mr-8 lg:ml-0 lg:rounded-r-2xl flex flex-col min-h-screen mb-6 lg:mb-0">
          <div className="mb-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/img/logo_footer.svg?v=1"
                alt="Единая Среда"
                width={208}
                height={60}
                className="h-auto w-auto block mb-5"
                priority
              />
            </Link>
          </div>

          <div className="mb-6">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 mr-2">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              На главную
            </Link>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Документы проекта</h3>
            <div className="space-y-2">
              {docFiles.map((doc) => (
                <button
                  key={doc.file}
                  onClick={() => handleDocClick(doc.file)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                    activeDoc === doc.file ? "bg-[#0077FF]/10 text-[#0077FF] font-medium" : "text-gray-700 hover:bg-[#F6F7F9]"
                  }`}
                >
                  <span className="inline-flex items-center mr-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="3" fill="#E53935" />
                      <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" fill="#fff" />
                    </svg>
                  </span>
                  {doc.title}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto text-xs text-gray-500">
            © Единая Среда, 2025. <br />Все права защищены.
          </div>
        </aside>

        {/* Content */}
        <section className="flex-1 bg-white rounded-2xl shadow-sm p-8 lg:p-12 min-h-screen">
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-blue-600 transition-colors">Единая Среда</Link>
            <span>/</span>
            <span className="text-gray-600">Документация</span>
            <span>/</span>
            <span className="text-gray-700">
              {activeDoc ? docTitles[activeDoc] : "Документы проекта"}
            </span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {activeDoc ? docTitles[activeDoc] : "Документы проекта"}
          </h1>

          <div className="text-gray-700 leading-relaxed mb-6">
            {activeDoc ? docDescriptions[activeDoc] : "Выберите документ в меню слева, чтобы просмотреть его описание и скачать."}
          </div>

          {activeDoc && encoded && (
            <>
              <div className="mb-6">
                <iframe
                  src={`/docs/${encoded}#toolbar=1&navpanes=0&scrollbar=1`}
                  className="w-full min-h-[600px] border border-gray-200 rounded-lg bg-white"
                  title={docTitles[activeDoc]}
                />
              </div>

              <div className="mt-6">
                <a
                  href={`/docs/${encoded}`}
                  download
                  className="inline-block px-6 py-3 bg-[#0077FF] text-white rounded-lg font-medium hover:bg-[#0077FF]/90 transition-colors"
                >
                  Скачать документ
                </a>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
