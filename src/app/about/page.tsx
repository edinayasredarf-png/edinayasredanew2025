"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function AboutPage() {
  const [statsImageIndex, setStatsImageIndex] = useState(0);

  const statsImages = [
    "/img/team/1.jpg",
    "/img/team/1.2.jpg",
    "/img/team/1.3.jpg",
    "/img/team/1.4.jpg",
    "/img/team/1.5.jpg",
    "/img/team/1.6.jpg",
    "/img/team/1.7.jpg",
    "/img/team/1.8.jpg",
    "/img/team/1.9.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatsImageIndex((prev) => (prev + 1) % statsImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [statsImages.length]);

  const historyItems = [
    { year: "2011", description: "Создание команды специалистов" },
    { year: "2013", description: "Выход на рынок закупок" },
    { year: "2014", description: "Закрыли первый крупный контракт" },
    { year: "2019", description: "Создали сервис Единая Среда" },
    { year: "2022", description: "Открытие АНО Область Развития" },
    { year: "2024", description: "Создание сервиса MyRoots" },
  ];

  return (
    <Layout>
      <div className="font-[Raleway] font-medium lining-nums">

        {/* Hero Section */}
        <section className="bg-[#029cda] text-white relative overflow-hidden min-h-[200px]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className="text-5xl sm:text-6xl md:text-[98px] font-medium leading-tight">
                  Что такое ЕС
                </h1>
                <p className="mt-8 text-xl sm:text-[27px] text-white/90 max-w-2xl">
                  Развиваем сервисы, которые помогают муниципалитетам решать повседневные задачи управления территориями и экологическими процессами
                </p>
              </div>
              <div className="hidden lg:flex flex-1 w-full h-full relative justify-end items-center z-10">
                <Image
                  src="/icons/toogle1.svg"
                  alt="Единая Среда"
                  width={300}
                  height={200}
                  className="w-full max-w-[120px] h-auto object-contain opacity-20"
                  priority
                  style={{ height: 'auto' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Numbers Section */}
        <section className="py-20 w-full">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-medium text-[#313131] text-left">
              Цифры говорят за нас
            </h2>
          </div>
        </section>

        {/* Statistics Row */}
        <section className="bg-gray-100 w-full py-2 px-4 md:px-0">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-0">
              <div className="py-10 text-left border-b md:border-b-0 md:border-r border-gray-300">
                <div className="text-6xl md:text-7xl font-bold text-[#313131] mb-3">40+</div>
                <div className="text-xl text-gray-700">регионов РФ уже пользуются сервисом</div>
              </div>
              <div className="py-10 text-left border-b md:border-b-0 md:border-r border-gray-300">
                <div className="text-6xl md:text-7xl font-bold text-[#313131] mb-3">500+</div>
                <div className="text-xl text-gray-700">реализованных проектов</div>
              </div>
              <div className="py-10 text-left">
                <div className="text-6xl md:text-7xl font-bold text-[#313131] mb-3">100M+</div>
                <div className="text-xl text-gray-700">инвентаризированных деревьев</div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Information Row */}
        <section className="py-20 w-full">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="py-10 text-left border-b md:border-b-0 md:pr-8 md:border-r border-gray-200">
                <h3 className="text-xl font-semibold text-[#313131] mb-4">Проекты и сервисы</h3>
                <p className="text-base text-[#7C8A9A] leading-relaxed">
                  Единая Среда объединяет экологический мониторинг, управление муниципальной собственностью и цифровизацию городских процессов в единую платформу для эффективного управления территориями.
                </p>
              </div>
              <div className="py-10 text-left border-b md:border-b-0 md:px-8 md:border-r border-gray-200">
                <h3 className="text-xl font-semibold text-[#313131] mb-4">Платформа</h3>
                <p className="text-base text-[#7C8A9A] leading-relaxed">
                  Пользователи могут работать с единой учетной записью, использовать ГИС-инструменты, анализировать экологические данные и управлять муниципальными ресурсами через единую цифровую среду.
                </p>
              </div>
              <div className="py-10 text-left md:pl-8">
                <h3 className="text-xl font-semibold text-[#313131] mb-4">Для муниципалитетов</h3>
                <p className="text-base text-[#7C8A9A] leading-relaxed">
                  Для муниципалитетов мы развиваем продукты и услуги для цифровизации экологических процессов — от инвентаризации зеленых насаждений до комплексного управления городской средой.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Statistics */}
        <section className="pt-4 pb-20 bg-[#F6F7F9]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-0 border-t border-gray-200">
              {/* Единая Среда */}
              <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
                <Link href="https://edinayasreda.ru/" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center mb-6 px-6 group">
                  <h3 className="text-xl font-medium text-[#313131] leading-loose group-hover:text-[#029cda] transition-colors">Единая Среда</h3>
                  <Image src="/icons/es-blue.svg" alt="Единая Среда" width={42} height={42} className="object-contain" />
                </Link>
                <div className="space-y-6 px-6">
                  <div>
                    <div className="text-[64px] font-medium text-[#313131] leading-[71.68px]">{">"}200</div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">компаний ежемесячно пользуются платформой</p>
                  </div>
                  <div>
                    <div className="text-[64px] font-medium text-[#313131] leading-[71.68px]">2000</div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">паспортов создано пользователями</p>
                  </div>
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-[64px] font-medium text-[#313131] leading-[71.68px]">10</span>
                      <span className="text-[38px] font-medium text-[#313131] leading-[42.56px] ml-2">млн</span>
                    </div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">просмотров в сутки</p>
                  </div>
                </div>
              </div>

              {/* MyRoots */}
              <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
                <Link href="https://myroots.pro/" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center mb-6 px-6 group">
                  <h3 className="text-xl font-medium text-[#313131] leading-loose group-hover:text-[#029cda] transition-colors">MyRoots</h3>
                  <Image src="/icons/myroots.svg" alt="MyRoots" width={42} height={42} className="object-contain" />
                </Link>
                <div className="space-y-6 px-6">
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-[64px] font-medium text-[#313131] leading-[71.68px]">20</span>
                      <span className="text-[38px] font-medium text-[#313131] leading-[42.56px] ml-2">тыс</span>
                    </div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">генеалогических деревьев создано пользователями</p>
                  </div>
                  <div>
                    <div className="text-[64px] font-medium text-[#313131] leading-[71.68px]">{">"}1300</div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">услуг по уходу за могилами оказано</p>
                  </div>
                  <div>
                    <div className="text-[64px] font-medium text-[#313131] leading-[71.68px]">12 семей</div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">нашли своих родственников</p>
                  </div>
                </div>
              </div>

              {/* Область Развития */}
              <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
                <Link href="https://oblastrazvitia.ru/" target="_blank" rel="noopener noreferrer" className="flex justify-between items-center mb-6 px-6 group">
                  <h3 className="text-xl font-medium text-[#313131] leading-loose group-hover:text-[#029cda] transition-colors">Область Развития</h3>
                  <Image src="/icons/oblastrazvitia.svg" alt="Область Развития" width={64} height={42} className="object-contain" />
                </Link>
                <div className="space-y-6 px-6">
                  <div>
                    <div className="text-[64px] font-medium text-[#313131] leading-[71.68px]">12</div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">субботников организовано и проведено</p>
                  </div>
                  <div>
                    <div className="text-[64px] font-medium text-[#313131] leading-[71.68px]">2</div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">детских площадки построено</p>
                  </div>
                  <div>
                    <div className="text-[64px] font-medium text-[#313131] leading-[71.68px]">2</div>
                    <p className="text-base font-medium text-[#313131] leading-normal mt-1">инвестора привлечено</p>
                  </div>
                </div>
              </div>

              {/* Блок с фото команды */}
              <div className="relative bg-[#029cda] p-2 overflow-hidden">
                <div className="relative h-full min-h-[300px] flex flex-col">
                  <div className="relative flex-1 overflow-hidden rounded-lg">
                    <Image
                      src={statsImages[statsImageIndex]}
                      alt="Наша команда"
                      fill
                      className="object-cover transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Нижняя секция с услугами */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-0 border-b border-gray-200 border-t border-gray-200">
              <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="mb-4 px-6">
                  <h3 className="text-xl font-medium text-[#313131] leading-loose">Инвентаризация зеленых насаждений</h3>
                </div>
                <div className="px-6">
                  <div className="flex items-baseline">
                    <span className="text-[64px] font-medium text-[#313131] leading-[71.68px]">7</span>
                    <span className="text-[38px] font-medium text-[#313131] leading-[42.56px] ml-2">млн</span>
                  </div>
                  <p className="text-base font-medium text-[#313131] leading-normal mt-1">деревьев за 2025 год</p>
                </div>
              </div>

              <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="mb-4 px-6">
                  <h3 className="text-xl font-medium text-[#313131] leading-loose">Инвентаризация мест захоронений</h3>
                </div>
                <div className="px-6">
                  <div className="flex items-baseline">
                    <span className="text-[64px] font-medium text-[#313131] leading-[71.68px]">5</span>
                    <span className="text-[38px] font-medium text-[#313131] leading-[42.56px] ml-2">млн</span>
                  </div>
                  <p className="text-base font-medium text-[#313131] leading-normal mt-1">мест захоронений за 2025 год</p>
                </div>
              </div>

              <div className="relative py-8 border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="mb-4 px-6">
                  <h3 className="text-xl font-medium text-[#313131] leading-loose">Лесоустройство</h3>
                </div>
                <div className="px-6">
                  <div className="flex items-baseline">
                    <span className="text-[64px] font-medium text-[#313131] leading-[71.68px]">2,7</span>
                    <span className="text-[38px] font-medium text-[#313131] leading-[42.56px] ml-2">млн</span>
                  </div>
                  <p className="text-base font-medium text-[#313131] leading-normal mt-1">га лесов проинвентаризировано</p>
                </div>
              </div>

              <div className="flex items-center justify-center py-8">
                <button className="px-6 py-3 border border-[#050b15] text-[#313131] rounded-lg hover:bg-[#029cda] hover:text-white transition-all duration-300 flex items-center gap-2">
                  <span className="text-base">Заказать услуги</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* History */}
        <section className="py-8 md:py-12 bg-[#029cda] text-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-2 md:mb-4 text-left">
              <h2 className="text-4xl md:text-6xl lg:text-[98px] font-medium leading-tight">История</h2>
              <p className="text-xl md:text-2xl max-w-3xl">Основные даты в жизни компании</p>
            </div>

            <div className="pt-10 md:pt-16">
              {/* Десктоп */}
              <div className="hidden md:flex justify-between relative">
                {historyItems.map((item, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col w-full px-2"
                    style={{ maxWidth: `${100 / historyItems.length}%` }}
                  >
                    <div className="text-left w-full">
                      <div className="text-3xl md:text-4xl font-bold mb-4">{item.year}</div>
                      <p className="text-base">{item.description}</p>
                    </div>
                    {index < historyItems.length - 1 && (
                      <div className="absolute top-2/8 right-4 transform translate-x-1/20 -translate-y-2/3">
                        <Image src="/icons/arrow.svg" alt="" width={50} height={50} className="object-contain" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Мобильная версия */}
              <div className="md:hidden space-y-8">
                {historyItems.map((item, index) => (
                  <div key={index} className="pb-8">
                    <div className="flex">
                      <div className="text-3xl font-bold mr-4 min-w-[80px]">{item.year}</div>
                      <p className="text-base flex-1">{item.description}</p>
                    </div>
                    {index < historyItems.length - 1 && (
                      <div className="h-px bg-white/30 mt-8" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
