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
              О компании и платформе
            </h2>
          </div>
        </section>

        <section className="bg-gray-100 w-full py-2 px-4 md:px-0">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
            {[
              ['2011', 'год создания команды специалистов'],
              ['ГИС', 'карта, паспорта объектов и история работ'],
              ['ПО РФ', 'запись №13314 от 15.04.2022 в реестре российского ПО'],
            ].map(([value, label]) => <div key={value} className="py-10"><div className="text-5xl font-bold text-[#313131] mb-3">{value}</div><p className="text-xl text-gray-700">{label}</p></div>)}
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

        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-4xl md:text-5xl text-[#313131] mb-10">Направления работы</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ['/services/izn', 'Зелёные насаждения', 'Полевое обследование, цифровые паспорта деревьев и кустарников, карта и планирование ухода.'],
              ['/services/imz', 'Места захоронений', 'Инвентаризация, геопривязка и цифровой реестр с поиском и связанными документами.'],
              ['/services/les', 'Лесные территории', 'Таксация, картографирование и подготовка лесоустроительных материалов.'],
            ].map(([href, title, text]) => <Link key={href} href={href} className="bg-[#F6F7F9] rounded-3xl p-7 hover:ring-1 hover:ring-[#029cda]"><h3 className="text-2xl text-[#313131] mb-4">{title}</h3><p className="text-[#7c8a9a] text-lg leading-relaxed">{text}</p></Link>)}
          </div>
          <div className="mt-6 rounded-3xl overflow-hidden"><Image src={statsImages[statsImageIndex]} alt="Команда «Единой среды»" width={1200} height={480} className="w-full max-h-[400px] object-cover" /></div>
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
                      <div className="h-px bg-[#F6F7F9]/30 mt-8" />
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
