"use client";
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';

export default function ContactsPage() {
  useEffect(() => {
    // Динамически загружаем скрипт Яндекс.Карт
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.src = 'https://api-maps.yandex.ru/services/constructor/1.0/js/?um=constructor%3Abc95fd3859638c7daa47e1662aaae6ce55e67126d111841305077e032b13ac18&amp;width=500&amp;height=500&amp;lang=ru_RU&amp;scroll=true';

    const mapContainer = document.getElementById('yandex-map');
    if (mapContainer) {
      mapContainer.appendChild(script);
    }

    return () => {
      // Очистка при размонтировании компонента
      if (mapContainer && script.parentNode) {
        mapContainer.removeChild(script);
      }
    };
  }, []);
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight">
                Контакты
              </h1>
              <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
                Свяжитесь с нами для получения консультации по вопросам лесоустройства и экологических услуг
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
              <section className="py-16 md:py-24 bg-[#F6F7F9]">
        <div className="max-w-[1480px] mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-12">
                Контактная информация
              </h2>

              {/* Sales Department */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-black mb-6">Отдел продаж</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-[#0077FF]">+7 (800) 550-56-12</p>
                    <p className="text-lg text-gray-600 mt-2">Основной телефон</p>
                  </div>
                  <div>
                    <p className="text-xl text-black">order@единаясреда.рф</p>
                    <p className="text-lg text-gray-600 mt-2">Email для заявок</p>
                  </div>
                  <div>
                    <p className="text-xl text-black">Пн-Пт: 9:00 - 18:00</p>
                    <p className="text-lg text-gray-600 mt-2">Время работы</p>
                  </div>
                </div>
              </div>


              {/* Address */}
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-black mb-6">Адрес</h3>
                <div>
                  <p className="text-xl text-black">г. Ростов-на-Дону, ул. Комарова, 28/2</p>
                  <p className="text-lg text-gray-600 mt-2">Офис 403, 4 этаж</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-4">
                <a
                  href="tel:+78005505612"
                  className="w-full px-8 py-4 border-2 border-[#0077FF] text-[#0077FF] text-lg font-medium rounded-xl hover:bg-[#0077FF] hover:text-white transition-colors text-center block"
                >
                  Позвонить нам
                </a>
                <a
                  href="mailto:order@единаясреда.рф"
                  className="w-full px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-medium rounded-xl hover:bg-[#F6F7F9] transition-colors text-center block"
                >
                  Написать письмо
                </a>
              </div>
            </div>

                        {/* Map */}
            <div className="relative">
                              <div id="yandex-map" className="bg-[#F6F7F9] rounded-3xl h-[500px] overflow-hidden">
                {/* Карта будет загружена через useEffect */}
              </div>
            </div>
          </div>
        </div>
      </section>

    </Layout>
  );
}