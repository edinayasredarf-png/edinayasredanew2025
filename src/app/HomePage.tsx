// app/HomePage.tsx

"use client";

import React from 'react';
import Layout from '../components/Layout';
import HeroSection from '../components/HeroSection';
import SectionAudience from '../components/SectionAudience';
import TrustSection from '../components/TrustSection';
import HomeCases from '../components/HomeCases';

import SupportersSection from '../components/SupportersSection';
import SplitStyleCards from '../components/SplitStyleCards';
import InventorySupportSection from '../components/InventorySupportSection';
import MapPlatformSection from '../components/MapPlatformSection';
import ResourcesLinksSection from '../components/ResourcesLinksSection';
import FAQ from '../components/FAQ';
import ContactChannelsSection from '../components/ContactChannelsSection';
import CtaSection from '../components/CtaSection';
import BenefitsSection from "@/components/BenefitsSection";
import PressSection from "@/components/PressSection";
import { SpeedInsights } from "@vercel/speed-insights/next";

// ========================================
// FAQ ДАННЫЕ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ
// ========================================
const homeFaqData = [
	{
		question: "Что такое Единая среда?",
		answer: "Единая среда — это российская цифровая платформа для управления муниципальными территориями. Система автоматизирует учёт объектов городской инфраструктуры: кладбищ, зелёных насаждений, торговых точек, ЛЭП, МАФов. Платформа помогает контролировать работу подрядчиков и получать аналитические отчёты в режиме реального времени."
	},
	{
		question: "Какие основные модули есть в платформе?",
		answer: "Платформа включает модули для инвентаризации мест захоронений на кладбищах, учёта и паспортизации зелёных насаждений, цифрового лесоустройства, контроля торговых точек и МАФов, управления линиями электропередач (ЛЭП). Каждый модуль имеет мобильное приложение для полевых работ."
	},
	{
		question: "Для кого предназначена платформа?",
		answer: "Решения Единая среда используются муниципальными службами, управляющими компаниями, МУПами, администрациями городов и районов. Система подходит для всех организаций, которые занимаются управлением территориями и городской инфраструктурой."
	},
	{
		question: "Какие преимущества платформы?",
		answer: "Платформа включена в реестр отечественного ПО, имеет более 15 лет опыта разработки цифровых решений, комплексную систему аналитики и отчётности, мобильное приложение для полевых работ. Система позволяет оптимизировать процессы учёта, контроля и планирования работ."
	},
	{
		question: "Как начать работу с платформой?",
		answer: "Для начала работы оставьте заявку на официальном сайте единаясреда.рф или позвоните по бесплатному номеру +7 (800) 550-56-12. Наши специалисты проведут демонстрацию системы, помогут подобрать подходящие модули и организуют обучение сотрудников."
	},
	{
		question: "Какая техническая поддержка доступна?",
		answer: "Техническая поддержка доступна через личный кабинет на сайте платформы, по телефону +7 (800) 550-56-12 и email info@единаясреда.рф. Специалисты помогают с настройкой системы, решением технических вопросов и обучением пользователей."
	},
	{
		question: "Есть ли у платформы мобильное приложение?",
		answer: "Да, платформа имеет мобильное приложение для Android и iOS, которое доступно в RuStore и других магазинах приложений. Мобильное приложение позволяет работать с системой в полевых условиях, фиксировать объекты, делать фотографии и заполнять паспорта."
	},
	{
		question: "Включена ли платформа в реестр отечественного ПО?",
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
			<HeroSection />
			<SupportersSection />

			{/* Карточки с разделением стилей */}
			<SplitStyleCards />
			<InventorySupportSection />
			<TrustSection/>

			{/* Кому подходит */}
			<SectionAudience />

			{/* Мощная картографическая платформа */}
			<MapPlatformSection />

			{/* 6 веских причин */}
			<BenefitsSection />

			{/* Кейсы */}
			<HomeCases/>

			{/* Полезные разделы (документация/блог/новости/чат) */}
			<ResourcesLinksSection />

			{/* СМИ о нас */}
			<PressSection />

			{/* Подробный FAQ */}
			<FAQ
				items={homeFaqData}
				title="Подробный FAQ"
			/>

			{/* Не нашли ответ — каналы связи */}
			<ContactChannelsSection />

			{/* CTA — развивайте территорию */}
			<CtaSection />
		</Layout>
	);
}
