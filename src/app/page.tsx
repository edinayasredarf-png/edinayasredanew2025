// app/page.tsx

import React from 'react';
import { Metadata } from 'next';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import SectionFeatures from '../components/SectionFeatures';
import BlueTrustSection from '../components/BlueTrustSection';
import PartnersWall from '../components/PartnersWall';
import SectionPlatformAndServices from '../components/SectionPlatformAndServices';
import SplitStyleCards from '../components/SplitStyleCards';
import SectionBestSolution from '../components/SectionBestSolution';
import SectionInterfaceSlider from '../components/SectionInterfaceSlider';
import SectionPublicPrivate from '../components/SectionPublicPrivate';
import SectionAllObjects from '../components/SectionAllObjects';
import SectionMigration from '../components/SectionMigration';
import SectionQuickStart from '../components/SectionQuickStart';
import HomePosts from '../components/HomePosts';
import HomeNews from '../components/HomeNews';
import SectionExpertise from '../components/SectionExpertise';
import SectionSubscribeChannels from '../components/SectionSubscribeChannels';
import FAQ from '../components/FAQ';
import { SpeedInsights } from "@vercel/speed-insights/next";

// ========================================
// SEO МЕТАДАННЫЕ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ
// ========================================
export const metadata: Metadata = {
  title: 'Единая среда — цифровая платформа управления территориями | единаясреда.рф',
  description: 'Единая среда (единаясреда.рф) — российская платформа для цифрового управления муниципальными территориями. Учёт кладбищ, зелёных насаждений, торговых точек, ЛЭП, МАФов. Контроль подрядчиков и аналитика. Более 15 лет на рынке. Включена в реестр отечественного ПО.',
  keywords: 'единая среда, единаясреда, единаясреда.рф, единая среда рф, единаясреда официальный сайт, платформа управления территориями, цифровизация городов, учёт кладбищ, инвентаризация зелёных насаждений, цифровое лесоустройство, контроль МАФов, управление ЛЭП, муниципальные цифровые решения',

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'Единая среда — цифровая платформа управления территориями',
    description: 'Российская платформа для цифрового управления муниципальными территориями. Учёт объектов городской инфраструктуры, контроль подрядчиков, аналитические дашборды. Более 15 лет на рынке.',
    url: 'https://единаясреда.рф',
    siteName: 'Единая среда',
    type: 'website',
    locale: 'ru_RU',
    images: [
      {
        url: 'https://единаясреда.рф/img/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Единая среда — цифровая платформа управления территориями',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Единая среда — цифровая платформа управления территориями',
    description: 'Российская платформа для цифрового управления муниципальными территориями. Учёт кладбищ, зелёных насаждений, контроль подрядчиков.',
    images: ['https://единаясреда.рф/img/og-image.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// ========================================
// FAQ ДАННЫЕ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ
// ========================================
const homeFaqData = [
  {
    question: "Что такое Единая среда (единаясреда.рф)?",
    answer: "Единая среда — это российская цифровая платформа для управления муниципальными территориями. Система автоматизирует учёт объектов городской инфраструктуры: кладбищ, зелёных насаждений, торговых точек, ЛЭП, МАФов. Платформа помогает контролировать работу подрядчиков и получать аналитические отчёты в режиме реального времени."
  },
  {
    question: "Какие основные модули есть в платформе Единая среда?",
    answer: "Платформа включает модули для инвентаризации мест захоронений на кладбищах, учёта и паспортизации зелёных насаждений, цифрового лесоустройства, контроля торговых точек и МАФов, управления линиями электропередач (ЛЭП). Каждый модуль имеет мобильное приложение для полевых работ."
  },
  {
    question: "Для кого предназначена платформа единаясреда.рф?",
    answer: "Решения Единая среда используются муниципальными службами, управляющими компаниями, МУПами, администрациями городов и районов. Система подходит для всех организаций, которые занимаются управлением территориями и городской инфраструктурой."
  },
  {
    question: "Какие преимущества платформы Единая среда?",
    answer: "Платформа включена в реестр отечественного ПО, имеет более 15 лет опыта разработки цифровых решений, комплексную систему аналитики и отчётности, мобильное приложение для полевых работ. Система позволяет оптимизировать процессы учёта, контроля и планирования работ."
  },
  {
    question: "Как начать работу с платформой Единая среда?",
    answer: "Для начала работы посетите официальный сайт единаясреда.рф или позвоните по бесплатному номеру +7 (800) 550-56-12. Наши специалисты проведут демонстрацию системы, помогут подобрать подходящие модули и организуют обучение сотрудников."
  },
  {
    question: "Какая техническая поддержка доступна пользователям единаясреда.рф?",
    answer: "Техническая поддержка доступна через личный кабинет на сайте единаясреда.рф, по телефону +7 (800) 550-56-12 и email info@единаясреда.рф. Специалисты помогают с настройкой системы, решением технических вопросов и обучением пользователей."
  },
  {
    question: "Есть ли у платформы Единая среда мобильное приложение?",
    answer: "Да, платформа имеет мобильное приложение для Android и iOS, которое доступно в RuStore и других магазинах приложений. Мобильное приложение позволяет работать с системой в полевых условиях, фиксировать объекты, делать фотографии и заполнять паспорта."
  },
  {
    question: "Включена ли платформа единаясреда.рф в реестр отечественного ПО?",
    answer: "Да, платформа Единая среда официально включена в реестр отечественного программного обеспечения. Это подтверждает соответствие системы требованиям российского законодательства и позволяет использовать её в государственных и муниципальных учреждениях."
  }
];

// ========================================
// ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ
// ========================================
export default function HomePage() {
  return (
    <Layout>
      {/* Speed Insights от Vercel */}
      <SpeedInsights />

      {/* Hero секция с главным заголовком */}
      <HeroSection />

      {/* Секция "Платформа и услуги" */}
      <SectionPlatformAndServices />

      {/* Карточки с разделением стилей */}
      <SplitStyleCards />

      {/* Синяя секция доверия */}
      <BlueTrustSection />

      {/* Стена партнёров */}
      <PartnersWall />

      {/* Слайдер интерфейса */}
      <SectionInterfaceSlider />

      {/* Секция Public/Private */}
      <SectionPublicPrivate />

      {/* Новости */}
      <HomeNews />

      {/* Все объекты */}
      <SectionAllObjects />

      {/* Миграция */}
      <SectionMigration />

      {/* Быстрый старт */}
      <SectionQuickStart />

      {/* Посты */}
      <HomePosts />

      {/* Секция экспертизы (15+ лет) */}
      <SectionExpertise />

      {/* ✅ FAQ СЕКЦИЯ */}
      <FAQ
        items={homeFaqData}
        title="Часто задаваемые вопросы"
        subtitle="О платформе Единая среда (единаясреда.рф)"
        showContactCard={true}
        contactCardTitle="Не нашли ответ на свой вопрос?"
        contactCardText="Задайте его нам — и мы оперативно ответим."
        contactButtonText="Задать вопрос"
      />

      {/* Подписка на каналы */}
      <SectionSubscribeChannels />
    </Layout>
  );
}
