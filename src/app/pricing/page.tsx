"use client";
import React from 'react';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';

export default function PricingPage() {
  const { openKP, openConsult } = useModal();

  return (
    <Layout>
      <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight">
                Выгодные тарифы<br />и услуги
              </h1>
              <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
                Простые решения для эффективного управления территориями и объектами. Прозрачные цены и поддержка на каждом этапе.
              </p>
              <div className="mt-10">
                <button
                  onClick={openKP}
                  className="inline-flex items-center justify-center bg-[#0077FF] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
                >
                  Запросить КП
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
              <img
                src="/img/price.png"
                alt="Абстрактная иллюстрация цен и тарифов"
                className="w-full max-w-[500px] object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>
          <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[600px] h-auto pointer-events-none">
            <img
              src="/img/price.png"
              alt="Абстрактная иллюстрация цен и тарифов"
              className="w-full object-contain"
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </section>
      <section className="max-w-[1400px] mx-auto mt-8">
        <div className="max-w-[1400px] mx-auto px-2 py-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <h2 className="text-4xl text-black font-medium text-left">
              Тарифы и услуги
            </h2>
            <div className="text-black text-xl max-w-xl">
              Все цены актуальны и прозрачны — для консультации или индивидуального расчёта воспользуйтесь кнопками ниже.
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">

                <Image src="/img/ес.svg" alt="Единая среда" width={360} height={360} className="object-contain max-w-[100%] max-h-[100%] mr-4" onError={e => e.currentTarget.style.display='none'} />

              <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                  <h3 className="text-xl font-medium text-black text-center md:text-left">Единая среда</h3>
                </div>
                <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                  Платформа для цифрового управления территориями, автоматизации процессов и аналитики для организаций любого масштаба.
                </p>
                <div className="flex flex-col gap-2 w-full mt-auto">
                  <div className="text-2xl font-regular text-black text-center">100 000 ₽</div>
                  <div className="text-base text-gray-500 text-center">за пользователя</div>
                  <button
                    onClick={openKP}
                    className="w-full inline-flex items-center justify-center bg-[#0077FF] text-white font-bold py-2 rounded-xl text-base hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
                  >
                    Получить КП
                  </button>
                  <button
                    onClick={openConsult}
                    className="w-full bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10 font-bold py-2 rounded-xl text-base transition-colors"
                  >
                    Получить консультацию
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">
                <Image src="/img/услуга_имз.png" alt="Инвентаризация мест захоронений" width={360} height={360} className="object-contain max-w-[100%] max-h-[100%] mr-4" onError={e => e.currentTarget.style.display='none'} />
              <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                  <h3 className="text-xl font-medium text-black text-center md:text-left">Инвентаризация мест захоронений</h3>
                </div>
                <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                  Комплексная инвентаризация и учет мест захоронений с формированием цифровой базы данных и картографией.
                </p>
                <div className="flex flex-col gap-2 w-full mt-auto">
                  <Link
                    href="/services/inventory-burials"
                    className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-xl text-base hover:bg-gray-200 transition-colors text-center"
                  >
                    Подробнее об услуге
                  </Link>
                  <button
                    onClick={openKP}
                    className="w-full inline-flex items-center justify-center bg-[#0077FF] text-white font-bold py-2 rounded-xl text-base hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
                  >
                    Получить КП
                  </button>
                  <button
                    onClick={openConsult}
                    className="w-full bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10 font-bold py-2 rounded-xl text-base transition-colors"
                  >
                    Получить консультацию
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">
                <Image src="/img/услуга_лес.png" alt="Лесоустройство" width={360} height={360} className="object-contain max-w-[100%] max-h-[100%] mr-4" onError={e => e.currentTarget.style.display='none'} />
              <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                  <h3 className="text-xl font-medium text-black text-center md:text-left">Лесоустройство</h3>
                </div>
                <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                  Проведение лесоустроительных работ, создание цифровых карт и отчетности для эффективного управления лесным фондом.
                </p>
                <div className="flex flex-col gap-2 w-full mt-auto">
                  <Link
                    href="/services/forest-management"
                    className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-xl text-base hover:bg-gray-200 transition-colors text-center"
                  >
                    Подробнее об услуге
                  </Link>
                  <button
                    onClick={openKP}
                    className="w-full inline-flex items-center justify-center bg-[#0077FF] text-white font-bold py-2 rounded-xl text-base hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
                  >
                    Получить КП
                  </button>
                  <button
                    onClick={openConsult}
                    className="w-full bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10 font-bold py-2 rounded-xl text-base transition-colors"
                  >
                    Получить консультацию
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">
                <Image src="/img/услуга_изн.png" alt="Инвентаризация зеленых насаждений" width={360} height={360} className="object-contain max-w-[100%] max-h-[100%] mr-4" onError={e => e.currentTarget.style.display='none'} />
              <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                  <h3 className="text-xl font-medium text-black text-center md:text-left">Инвентаризация зеленых насаждений</h3>
                </div>
                <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                  Профессиональная инвентаризация и паспортизация зеленых насаждений с фотофиксацией и геопривязкой.
                </p>
                <div className="flex flex-col gap-2 w-full mt-auto">
                  <div className="text-2xl font-regular text-black text-center"></div>
                  <Link
                    href="/services/green-inventory"
                    className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-xl text-base hover:bg-gray-200 transition-colors text-center"
                  >
                    Подробнее об услуге
                  </Link>
                  <button
                    onClick={openKP}
                    className="w-full inline-flex items-center justify-center bg-[#0077FF] text-white font-bold py-2 rounded-xl text-base hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
                  >
                    Получить КП
                  </button>
                  <button
                    onClick={openConsult}
                    className="w-full bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10 font-bold py-2 rounded-xl text-base transition-colors"
                  >
                    Получить консультацию
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}