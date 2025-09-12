"use client";
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';
import { cases } from '@/data/cases';

const CasesPage: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('Все отрасли');
  const [selectedApplication, setSelectedApplication] = useState('Все типы');
  const [industryOpen, setIndustryOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const { openConsult } = useModal();

  const industries = [
    'Все отрасли',
    'Ритейл и FMCG',
    'Информационные технологии',
    'Транспорт и логистика',
    'Медицина и фармацевтика',
    'Финансы и страхование',
    'Образование и наука',
    'Промышленность и производство',
    'Государственное управление',
    'Медиа и развлечения',
    'Туризм и отдых'
  ];

  const applications = [
    'Все типы',
    'Единая Среда',
    'Инвентаризация зеленых насаждений',
    'Инвентаризация мест захоронений',
    'Лесоустройство',
    'Мелиорация',
    'Волонтерство',
  ];

  const filteredCases = cases.filter(caseItem => {
    const industryMatch = selectedIndustry === 'Все отрасли' || caseItem.industry === selectedIndustry;
    const applicationMatch = selectedApplication === 'Все типы' || caseItem.application === selectedApplication;
    return industryMatch && applicationMatch;
  });

  const resetFilters = () => {
    setSelectedIndustry('Все отрасли');
    setSelectedApplication('Все типы');
    setIndustryOpen(false);
    setApplicationOpen(false);
  };

  // Закрытие выпадающих списков при клике вне их области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.filter-dropdown')) {
        setIndustryOpen(false);
        setApplicationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Layout>
      <div className="bg-[#F6F7F9] min-h-screen">
        {/* Hero Section */}
<section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
    <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
      <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
        <h1 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight">
          Кейсы
        </h1>
        <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
Реальные проекты и решения, которые мы реализовали для наших клиентов

        </p>
        <div className="mt-10">
          <button
            onClick={openConsult}
            className="inline-flex items-center justify-center bg-[#0077FF] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
          >
            Получить консультацию
          </button>
        </div>
      </div>

      {/* Мобильное изображение */}
      <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
        <img
          src="/img/cases/cases-hero.svg"
          alt="Иллюстрация кейсов"
          className="w-full max-w-[500px] object-contain"
          style={{ height: 'auto' }}
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      </div>
    </div>

    {/* Десктопное изображение справа */}
    <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[450px] h-auto pointer-events-none">
      <img
        src="/img/cases/cases-hero.svg"
        alt="Иллюстрация кейсов"
        className="w-full object-contain"
        style={{ height: 'auto' }}
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    </div>
  </div>
</section>


        {/* Filters Section */}
      <section className="py-8">
        <div className="max-w-[1480px] mx-auto px-5 md:px-8">
          <div className="mb-4">
            <p className="text-gray-500 text-sm">Фильтруйте кейсы по отрасли и типу услуги для быстрого поиска нужных решений</p>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative group w-full sm:w-80 filter-dropdown">
                <button
                  onClick={() => setIndustryOpen(!industryOpen)}
                  className="w-full px-6 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 transition-all duration-200 cursor-pointer flex items-center justify-between"
                >
                  <span>{selectedIndustry}</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${industryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {industryOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-full">
                    {industries.map((industry) => (
                      <button
                        key={industry}
                        onClick={() => {
                          setSelectedIndustry(industry);
                          setIndustryOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedIndustry === industry ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        {industry}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative group w-full sm:w-80 filter-dropdown">
                <button
                  onClick={() => setApplicationOpen(!applicationOpen)}
                  className="w-full px-6 py-3 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 transition-all duration-200 cursor-pointer flex items-center justify-between"
                >
                  <span>{selectedApplication}</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${applicationOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {applicationOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-full">
                    {applications.map((application) => (
                      <button
                        key={application}
                        onClick={() => {
                          setSelectedApplication(application);
                          setApplicationOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedApplication === application ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        {application}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
                          <button
                onClick={resetFilters}
                className="w-full sm:w-80 px-6 py-3 bg-white text-gray-900 border-0 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </section>


        {/* Cases Grid */}
      <section id="cases-grid" className="max-w-[1480px] mx-auto px-5 md:px-8 py-4">
          {filteredCases.length === 0 ? (
            <div className="text-center py-20">
            <div className="text-gray-400 text-6xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">По выбранным фильтрам кейсы не найдены</h3>
            <p className="text-gray-600 mb-8">Попробуйте изменить параметры фильтрации</p>
              <button
                onClick={resetFilters}
              className="inline-block bg-[#0077FF] text-white px-8 py-3 rounded-lg hover:bg-[#0077FF]/90 transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                       {filteredCases.filter(c => !c.featured).map((caseItem, index) => {
           // Каждая 5-я карточка будет занимать место как 2 карточки (разнобой)
           const isWide = (index + 1) % 5 === 0;

                // Массив изображений для кейсов
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
                  '/img/cases/case9.png'
                ];

                return (
                  <Link
                    key={caseItem.id}
                    href={`/cases/${caseItem.id}`}
                    className={`group ${isWide ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : ''}`}
                  >
                                    <div className="bg-white rounded-2xl p-2 flex h-full transition-all duration-300 outline outline-[0.5px] outline-transparent hover:outline-[#0077FF]">
                  <div className={`bg-[#F6F7F9] rounded-xl p-4 flex flex-col ${isWide ? 'md:flex-row' : ''} h-full items-stretch relative overflow-hidden min-h-[450px] ${isWide ? 'md:min-h-[380px]' : ''}`}>
                    {/* Изображение */}
                    <div className={`w-full mb-4 ${isWide ? 'md:w-1/2 md:flex md:justify-center md:items-center md:ml-4 md:order-2' : ''}`}>
                      <div className={`relative w-full h-auto rounded-xl flex items-center justify-center overflow-hidden ${isWide ? 'md:w-full md:h-auto' : ''}`}>
                        <img
                          src={caseImages[caseItem.id - 1] || caseImages[0]}
                          alt={caseItem.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* Контент */}
                    <div className={`flex flex-col justify-between flex-1 ${isWide ? 'md:w-1/2 md:order-1' : ''}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-[#0077FF] text-white px-2 py-1 rounded-lg text-xs font-medium">
                            {caseItem.application}
                          </span>
                        </div>
                        <h3 className={`text-xl font-bold text-black leading-tight mb-3 ${isWide ? 'md:text-2xl' : ''}`}>
                          {caseItem.title}
                        </h3>
                        <p className={`text-sm text-gray-600 mb-4 line-clamp-2 ${isWide ? 'md:text-base md:line-clamp-3' : ''}`}>
                          {caseItem.description}
                        </p>
                        <div className="flex items-center gap-1 mb-3">
                          <svg className="w-4 h-4 text-[#0077FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="text-sm text-gray-600">{caseItem.location}</span>
                        </div>

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
            </>
          )}
        </section>

      {/* CTA Section */}
      <section className="bg-[#F6F7F9] py-16">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Готовы реализовать похожий проект?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Свяжитесь с нами для обсуждения ваших задач и получения персонального предложения
            </p>
            <button
              onClick={openConsult}
              className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#0077FF]/90 transition-colors"
            >
              Получить консультацию
            </button>
          </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CasesPage;