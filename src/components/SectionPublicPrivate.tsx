// components/SectionPublicPrivate.tsx

'use client'

import React, { useState } from 'react';
import Image from 'next/image';

const problemsAndSolutions = [
  {
    problem: 'Хаос в учёте и документации',
    solution: 'Единая база данных с историей изменений'
  },
  {
    problem: 'Сложности с отчетностью и проверками',
    solution: 'Автоматическая генерация отчётов за 2 клика'
  },
  {
    problem: 'Несовместимость данных между отделами',
    solution: 'Общий доступ для всех подразделений'
  },
  {
    problem: 'Потери информации при смене специалистов',
    solution: 'Облачное хранение и резервное копирование'
  },
  {
    problem: 'Отсутствие цифровой карты объектов',
    solution: 'Интерактивная карта'
  },
];

const SectionPublicPrivate: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'problems' | 'solutions'>('problems');

  return (
    <section className="max-w-[1480px] mx-auto px-5 md:px-8 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ========================================
            ЛЕВАЯ КАРТОЧКА: Офлайн работа
            ======================================== */}
        <article className="group bg-white rounded-[20px] p-8 overflow-hidden flex flex-col md:flex-row min-h-[276px] transition-all duration-300">
          <div className="flex-1 flex flex-col justify-between h-full">
            <h3 className="font-medium text-black text-lg md:text-xl lg:text-2xl leading-9 mb-2 transition-colors duration-300 group-hover:text-[#0077FF]">
              Можно работать с телефона<br />даже без интернета
            </h3>
            <p className="text-black/70 leading-snug text-[15px] sm:text-[16px] md:text-[16px] transition-colors duration-300 group-hover:text-black/90">
              Отметить границы захоронения, добавить атрибуты ЗНО или МАФа —
              <br className="hidden md:block" />
              можно с телефона на объекте, даже если там не ловит связь.
            </p>
            <a
              href="https://www.rustore.ru/catalog/app/ru.edinayasreda"
              className="inline-block group/link"
            >
              <Image
                src="/icons/Rustore Logo Color Light.svg"
                width={176}
                height={80}
                alt="RuStore"
                className="w-auto h-20 max-w-[176px] object-contain transition-all duration-900 active:scale-100 group-hover/link:drop-shadow-xs"
              />
            </a>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto mt-6 md:mt-0 md:ml-1">
            {/* Серый фон + одинаковый зазор до белой карточки со всех сторон */}
            <div className="p-2 bg-[#F6F7F9] rounded-2xl flex justify-center md:justify-end items-end">
              <div className="relative w-[140px] h-[140px] sm:w-[168px] sm:h-[168px] md:w-[176px] md:h-[176px] lg:w-[292px] lg:h-[322px] transition-transform duration-500">
                <Image
                  src="/img/no_wifi.webp"
                  alt="Телефон: офлайн-работа"
                  fill
                  sizes="(max-width: 767px) 140px, (max-width: 1023px) 168px, (max-width: 1279px) 176px, 292px"
                  className="object-contain transition-all duration-1500"
                  priority={false}
                />
              </div>
            </div>
          </div>
        </article>

        {/* ========================================
            ПРАВАЯ КАРТОЧКА: Проблемы/Решения
            ======================================== */}
        <article className="group bg-white rounded-[20px] p-8 overflow-hidden min-h-[276px] flex flex-col transition-all duration-300  ">
          <div className="flex flex-col md:flex-row h-full gap-6">
            {/* Левая часть: Табы и список */}
            <div className="flex-1 flex flex-col">
              {/* Табы-переключатель с соединяющимися линиями */}
              <div className="mb-8">
                <div className="flex gap-8">
                  {/* Кнопка "Ваша проблема" */}
                  <button
                    onClick={() => setActiveTab('problems')}
                    className={`group/tab relative pb-3 text-base font-medium transition-all duration-300 whitespace-nowrap ${
                      activeTab === 'problems'
                        ? 'text-black'
                        : 'text-black/60 hover:text-black/80'
                    }`}
                  >
                    <span className="relative z-10">Ваша проблема</span>
                    {/* Линия удлинена вправо на половину gap (16px = gap-8 / 2) */}
                    <span
                      className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${
                        activeTab === 'problems'
                          ? 'bg-[#0077FF]'
                          : 'bg-[#E2E2E2] group-hover/tab:bg-[#C4C4C4]'
                      }`}
                      style={{ right: '-16px' }}
                    />
                    {/* Hover эффект: подсветка снизу */}
                    {activeTab !== 'problems' && (
                      <span className="absolute bottom-0 left-0 right-[-16px] h-0.5 bg-[#0077FF]/0 group-hover/tab:bg-[#0077FF]/20 transition-all duration-300" />
                    )}
                  </button>

                  {/* Кнопка "Наше решение" */}
                  <button
                    onClick={() => setActiveTab('solutions')}
                    className={`group/tab relative pb-3 text-base font-medium transition-all duration-300 whitespace-nowrap ${
                      activeTab === 'solutions'
                        ? 'text-black'
                        : 'text-black/60 hover:text-black/80'
                    }`}
                  >
                    <span className="relative z-10">Наше решение</span>
                    {/* Линия удлинена влево на половину gap (16px = gap-8 / 2) */}
                    <span
                      className={`absolute bottom-0 right-0 h-0.5 transition-all duration-300 ${
                        activeTab === 'solutions'
                          ? 'bg-[#0077FF]'
                          : 'bg-[#E2E2E2] group-hover/tab:bg-[#C4C4C4]'
                      }`}
                      style={{ left: '-16px' }}
                    />
                    {/* Hover эффект: подсветка снизу */}
                    {activeTab !== 'solutions' && (
                      <span className="absolute bottom-0 left-[-16px] right-0 h-0.5 bg-[#0077FF]/0 group-hover/tab:bg-[#0077FF]/20 transition-all duration-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Список с анимацией появления */}
              <div className="flex-1 space-y-4">
                {activeTab === 'problems' ? (
                  // ПРОБЛЕМЫ
                  problemsAndSolutions.map((item, idx) => (
                    <div
                      key={`problem-${idx}`}
                      className="group/item flex items-start gap-3 animate-fadeInUp opacity-0"
                      style={{
                        animationDelay: `${idx * 80}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#E2E2E2] flex-shrink-0 mt-2 transition-all duration-300 group-hover/item:bg-[#FF6B6B] " />
                      <p className="text-black text-base leading-relaxed transition-all duration-300 ">
                        {item.problem}
                      </p>
                    </div>
                  ))
                ) : (
                  // РЕШЕНИЯ
                  problemsAndSolutions.map((item, idx) => (
                    <div
                      key={`solution-${idx}`}
                      className="group/item flex items-start gap-3 animate-fadeInUp opacity-0"
                      style={{
                        animationDelay: `${idx * 80}ms`,
                        animationFillMode: 'forwards'
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#0077FF] flex-shrink-0 mt-2 transition-all duration-300 group-hover/item:bg-[#00A3FF] " />
                      <p className="text-black text-base leading-relaxed transition-all duration-300 group-hover/item:text-[#0077FF] ">
                        {item.solution}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Правая часть: Изображение с анимацией */}
            <div className="flex-shrink-0 flex justify-center md:items-center w-full md:w-auto">
              <div className="relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] md:w-[192px] md:h-[192px] lg:w-[220px] lg:h-[220px] transition-transform duration-500 ">
                {activeTab === 'problems' ? (
                  <Image
                    src="/img/problem.webp"
                    alt="Типовые проблемы учета"
                    fill
                    sizes="(max-width: 767px) 240px, (max-width: 1023px) 192px, 220px"
                    className="object-contain animate-fadeIn"
                    priority={false}
                  />
                ) : (
                  <Image
                    src="/img/solution.webp"
                    alt="Решения платформы"
                    fill
                    sizes="(max-width: 767px) 240px, (max-width: 1023px) 192px, 220px"
                    className="object-contain animate-fadeIn"
                    priority={false}
                  />
                )}
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* CSS Анимации */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </section>
  );
};

export default SectionPublicPrivate;
