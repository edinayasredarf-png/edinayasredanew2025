"use client";
import React from 'react';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Button from '@/components/Button';

export default function CareerPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight">
                Карьера в Единой Среде
              </h1>
              <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
                Присоединяйтесь к команде профессионалов и участвуйте в цифровой революции экологического управления
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://hh.ru/employer/123456" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button variant="primary" size="large" className="w-full md:w-auto">
                    Посмотреть вакансии на HH.ru
                  </Button>
                </a>
                <Button variant="secondary" size="large" className="w-full md:w-auto">
                  Узнать о компании
                </Button>
              </div>
            </div>
            <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
              <Image
                src="/img/heroes.png"
                alt="Карьера"
                width={700}
                height={500}
                className="w-full max-w-[500px] object-contain"
                priority
                style={{ height: 'auto' }}
              />
            </div>
          </div>
          <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[600px] h-auto pointer-events-none">
            <Image
              src="/img/heroes.png"
              alt="Карьера"
              width={700}
              height={500}
              className="w-full object-contain"
              priority
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </section>

      {/* Why Work With Us Section */}
      <section className="max-w-[1400px] mx-auto mt-8">
        <div className="max-w-[1400px] mx-auto px-2 py-2">
          <h2 className="text-4xl text-black font-medium mb-12 text-left">
            Почему стоит работать с нами
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-4xl p-6 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-[#F6F7F9] rounded-2xl flex items-center justify-center w-16 h-16 mb-4">
                <Image src="/img/proverka.svg" alt="Инновации" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">Инновационные проекты</h3>
              <p className="text-gray-500">
                Работайте над передовыми технологиями в сфере экологического управления и цифровизации
              </p>
            </div>

            <div className="bg-white rounded-4xl p-6 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-[#F6F7F9] rounded-2xl flex items-center justify-center w-16 h-16 mb-4">
                <Image src="/img/support.svg" alt="Развитие" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">Профессиональный рост</h3>
              <p className="text-gray-500">
                Постоянное обучение, участие в конференциях и возможность карьерного развития
              </p>
            </div>

            <div className="bg-white rounded-4xl p-6 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-[#F6F7F9] rounded-2xl flex items-center justify-center w-16 h-16 mb-4">
                <Image src="/img/pole.svg" alt="Команда" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">Дружная команда</h3>
              <p className="text-gray-500">
                Работа в команде профессионалов с богатым опытом в государственном и частном секторе
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HH.ru Integration Section */}
      <section className="max-w-[1400px] mx-auto mt-8">
        <div className="max-w-[1400px] mx-auto px-2 py-2">
          <h2 className="text-4xl text-black font-medium mb-12 text-left">
            Наши вакансии на HH.ru
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-4xl p-6 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-[#F6F7F9] rounded-2xl flex items-center justify-center w-16 h-16 mb-4">
                <Image src="/img/proverka.svg" alt="HH.ru" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">Актуальные вакансии</h3>
              <p className="text-gray-500 mb-6">
                Все наши открытые позиции размещены на платформе HeadHunter. Там вы найдете подробные описания вакансий, требования и условия работы.
              </p>
              <div className="space-y-3 text-gray-500 mb-6">
                <p>• Frontend/Backend разработчики</p>
                <p>• Экологи-эксперты</p>
                <p>• Менеджеры проектов</p>
                <p>• Специалисты по ГИС</p>
              </div>
              <a 
                href="https://hh.ru/employer/123456" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="primary" size="large" className="w-full">
                  Перейти на HH.ru
                </Button>
              </a>
            </div>

            <div className="bg-white rounded-4xl p-6 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-[#F6F7F9] rounded-2xl flex items-center justify-center w-16 h-16 mb-4">
                <Image src="/img/support.svg" alt="Преимущества" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">Наши преимущества</h3>
              <p className="text-gray-500 mb-6">
                Мы предлагаем отличные условия для профессионального роста и развития
              </p>
              <div className="space-y-3 text-gray-500 mb-6">
                <p>• Конкурентная зарплата</p>
                <p>• Удаленная работа</p>
                <p>• Обучение и развитие</p>
                <p>• ДМС и социальный пакет</p>
              </div>
              <a 
                href="https://hh.ru/employer/123456" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="secondary" size="large" className="w-full">
                  Узнать больше
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-[1400px] mx-auto mt-8">
        <div className="max-w-[1400px] mx-auto px-2 py-2">
          <h2 className="text-4xl text-black font-medium mb-12 text-left">
            Наши преимущества
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-4xl p-6 text-center hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-gray-100 rounded-2xl flex items-center justify-center w-16 h-16 mx-auto mb-4">
                <Image src="/img/proverka.svg" alt="Зарплата" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-2">Конкурентная зарплата</h3>
              <p className="text-gray-500">Высокий уровень оплаты труда</p>
            </div>

            <div className="bg-white rounded-4xl p-6 text-center hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-gray-100 rounded-2xl flex items-center justify-center w-16 h-16 mx-auto mb-4">
                <Image src="/img/support.svg" alt="Обучение" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-2">Обучение и развитие</h3>
              <p className="text-gray-500">Курсы, конференции, сертификации</p>
            </div>

            <div className="bg-white rounded-4xl p-6 text-center hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-gray-100 rounded-2xl flex items-center justify-center w-16 h-16 mx-auto mb-4">
                <Image src="/img/pole.svg" alt="Гибкость" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-2">Гибкий график</h3>
              <p className="text-gray-500">Удаленная работа и гибкие часы</p>
            </div>

            <div className="bg-white rounded-4xl p-6 text-center hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 transition-all duration-300">
              <div className="bg-gray-100 rounded-2xl flex items-center justify-center w-16 h-16 mx-auto mb-4">
                <Image src="/img/proverka.svg" alt="Медицина" width={32} height={32} className="object-contain" />
              </div>
              <h3 className="text-xl font-medium text-black mb-2">ДМС</h3>
              <p className="text-gray-500">Добровольное медицинское страхование</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-black text-white rounded-[20px] mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight mb-8">
              Готовы присоединиться?
            </h2>
            <p className="text-xl sm:text-[27px] text-grey-92 max-w-2xl mx-auto mb-10">
              Перейдите на HH.ru, чтобы увидеть все наши вакансии и откликнуться на интересующие позиции
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://hh.ru/employer/123456" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="primary" size="large" className="w-full md:w-auto">
                  Перейти на HH.ru
                </Button>
              </a>
              <Button variant="secondary" size="large" className="w-full md:w-auto">
                Связаться с HR
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 