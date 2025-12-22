// app/HomePage.tsx

"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Layout from '../components/Layout';
import HeroSectionHN from '../components/HeroSectionHN';
import SupportersSection from '../components/SupportersSection';
import TerritoryControlSection from '../components/TerritoryControlSection';
import SplitStyleCards from '../components/SplitStyleCards';
import CompanyBadgesProps from '../components/CompanyBadgesProps';
import BenefitsSection from "@/components/BenefitsSection";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Динамические импорты для секций ниже fold (ленивая загрузка)
const InterfaceSystem = dynamic(() => import('../components/InterfaceSystem'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const VideoInvite = dynamic(() => import('../components/VideoInvite'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const HomeNews = dynamic(() => import('../components/HomeNews'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const SectionAllObjects = dynamic(() => import('../components/SectionAllObjects'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const SectionMigration = dynamic(() => import('../components/SectionMigration'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const SectionQuickStart = dynamic(() => import('../components/SectionQuickStart'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const HomePosts = dynamic(() => import('../components/HomePosts'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const SectionExpertise = dynamic(() => import('../components/SectionExpertise'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const FAQ = dynamic(() => import('../components/FAQ'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});

const SectionSubscribeChannels = dynamic(() => import('../components/SectionSubscribeChannels'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" />,
  ssr: false
});


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
    answer: "Для начала работы оставьте заявку на официальном сайте единаясреда.рф или позвоните по бесплатному номеру +7 (800) 550-56-12. Наши специалисты проведут демонстрацию системы, помогут подобрать подходящие модули и организуют обучение сотрудников."
  },
  {
    question: "Какая техническая поддержка доступна пользователям единаясреда.рф?",
    answer: "Техническая поддержка доступна через личный кабинет на сайте платформы, по телефону +7 (800) 550-56-12 и email info@единаясреда.рф. Специалисты помогают с настройкой системы, решением технических вопросов и обучением пользователей."
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
// ГЛАВНЫЙ CLIENT COMPONENT
// ========================================
export default function HomePage() {
  return (
    <Layout>

      {/* Speed Insights от Vercel */}
      <SpeedInsights />

      {/* Hero секция с главным заголовком */}
      <HeroSectionHN />
			<BenefitsSection/>
			<SupportersSection/>
			<TerritoryControlSection/>


      {/* Карточки с разделением стилей */}
      <SplitStyleCards />
			<CompanyBadgesProps/>



      {/* Слайдер интерфейса */}
			<InterfaceSystem/>
			<VideoInvite/>



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
