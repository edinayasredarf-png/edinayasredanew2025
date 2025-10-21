'use client';
import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import SectionPlatformAndServices from '@/components/SectionPlatformAndServices';
import SplitStyleCards from '@/components/SplitStyleCards';
import BlueTrustSection from '@/components/BlueTrustSection';
import PartnersWall from '@/components/PartnersWall';
import SectionInterfaceSlider from '@/components/SectionInterfaceSlider';
import SectionPublicPrivate from '@/components/SectionPublicPrivate';
import SectionAllObjects from '@/components/SectionAllObjects';
import SectionMigration from '@/components/SectionMigration';
import SectionQuickStart from '@/components/SectionQuickStart';
import SectionExpertise from '@/components/SectionExpertise';
import SectionSubscribeChannels from '@/components/SectionSubscribeChannels';
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function EdinayaSredaPage() {
  return (
    <Layout>
      <SpeedInsights />
      
      {/* Hero Section с SEO-оптимизированным контентом */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="text-blue-600">Единая среда</span> — цифровая платформа для управления территориями
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto">
              <strong>Единая среда РФ</strong> — современная цифровая платформа для учёта, 
              управления и мониторинга территорий и объектов. Цифровизация территорий, 
              управление лесами, инвентаризация объектов.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/services" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Наши услуги
              </a>
              <a 
                href="/contacts" 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Связаться с нами
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Что такое Единая среда */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Что такое <span className="text-blue-600">Единая среда</span>?
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto">
              <strong>Единая среда</strong> — это инновационная цифровая платформа, которая 
              обеспечивает полный цикл управления территориями: от инвентаризации объектов 
              до мониторинга их состояния в реальном времени.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🌲</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Управление лесами</h3>
              <p className="text-gray-700">
                Комплексный мониторинг лесных ресурсов и экосистем
              </p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Инвентаризация объектов</h3>
              <p className="text-gray-700">
                Точный учёт всех территориальных объектов и ресурсов
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Мониторинг территорий</h3>
              <p className="text-gray-700">
                Постоянное отслеживание состояния объектов в реальном времени
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Основные возможности */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Основные возможности платформы <span className="text-blue-600">Единая среда</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Цифровизация территорий</h3>
              <p className="text-gray-700">
                Полный переход на цифровые технологии учёта и управления
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Территориальное планирование</h3>
              <p className="text-gray-700">
                Стратегическое развитие и планирование территорий
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">ГИС-интеграция</h3>
              <p className="text-gray-700">
                Интеграция с существующими ГИС-платформами и системами
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Аналитика и отчётность</h3>
              <p className="text-gray-700">
                Детальная аналитика и автоматизированная отчётность
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Мобильный доступ</h3>
              <p className="text-gray-700">
                Работа с данными в полевых условиях через мобильные устройства
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Безопасность данных</h3>
              <p className="text-gray-700">
                Защищённое хранение и передача конфиденциальной информации
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Кому подходит */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Кому подходит <span className="text-blue-600">Единая среда</span>?
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto">
              Платформа <strong>Единая среда РФ</strong> предназначена для различных 
              организаций, работающих с территориями и природными ресурсами.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-3xl">🏛️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Государственные органы</h3>
              <p className="text-gray-700">
                Органы государственной власти и местного самоуправления
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-3xl">🌲</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Лесные хозяйства</h3>
              <p className="text-gray-700">
                Лесные хозяйства и природоохранные организации
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-3xl">🏘️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Муниципалитеты</h3>
              <p className="text-gray-700">
                Муниципальные образования и городские администрации
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-600 text-3xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Коммерческие организации</h3>
              <p className="text-gray-700">
                Коммерческие организации, работающие с территориями
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-3xl">🔬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Научные институты</h3>
              <p className="text-gray-700">
                Научно-исследовательские институты и университеты
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-3xl">🌍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Экологические организации</h3>
              <p className="text-gray-700">
                Экологические и природоохранные организации
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Используем существующие компоненты для консистентности */}
      <SectionPlatformAndServices />
      <SplitStyleCards />
      <BlueTrustSection />
      <PartnersWall />
      <SectionInterfaceSlider />
      <SectionPublicPrivate />
      <SectionAllObjects />
      <SectionMigration />
      <SectionQuickStart />
      <SectionExpertise />
      <SectionSubscribeChannels />
    </Layout>
  );
}
