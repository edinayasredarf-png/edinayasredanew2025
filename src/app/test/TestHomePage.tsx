// app/test/TestHomePage.tsx
// Экспериментальная версия главной для тестирования нового дизайна.
// Секции добавляем поэтапно. Пока — только новый Hero.

"use client";

import React from 'react';
import Layout from '../../components/Layout';
import HeroSectionTest from '../../components/test/HeroSectionTest';
import SystemScrollSection from '../../components/test/SystemScrollSection';
import StatsSection from '../../components/test/StatsSection';
import HowSystemSection from '../../components/test/HowSystemSection';
import SixReasonsSection from '../../components/test/SixReasonsSection';
import WhyChooseSection from '../../components/test/WhyChooseSection';
import CasesRedesignSection from '../../components/test/CasesRedesignSection';
import PressRedesignSection from '../../components/test/PressRedesignSection';
import FaqRedesignSection from '../../components/test/FaqRedesignSection';

export default function TestHomePage() {
	return (
		<Layout headerVariant="test">
			<HeroSectionTest />

			{/* Планшеты с системой — кроссфейд-слайдер */}
			<SystemScrollSection />

			{/* Цифры о нас + логотипы партнёров */}
			<StatsSection />

			{/* Кому нужна система — карточки для муниципалитетов и бизнеса */}
			<HowSystemSection />

			{/* 6 веских причин выбрать систему */}
			<SixReasonsSection />

			{/* Почему нас выбирают уже более 15 лет */}
			<WhyChooseSection />

			{/* Реализованные проекты — редизайн кейсов (только на /test) */}
			<CasesRedesignSection />

			{/* СМИ о нас — редизайн (только на /test) */}
			<PressRedesignSection />

			{/* FAQ — редизайн (только на /test) */}
			<FaqRedesignSection />
		</Layout>
	);
}
