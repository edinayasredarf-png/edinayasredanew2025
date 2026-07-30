'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

/**
 * FaqRedesignSection — редизайн блока FAQ только для тестовой страницы /test.
 * Те же вопросы/ответы, что и на главной. Аккордеон: белые карточки с рамкой,
 * градиентный шеврон, раскрытие одного пункта за раз (первый открыт по умолчанию).
 * Заголовок — Bebas Neue Cyrillic, тело — Raleway.
 */

type QA = { question: string; answer: string };

const FAQ_ITEMS: QA[] = [
	{
		question: 'Что такое Единая среда?',
		answer:
			'Единая среда — это российская цифровая платформа для управления муниципальными территориями. Система автоматизирует учёт объектов городской инфраструктуры: кладбищ, зелёных насаждений, торговых точек, ЛЭП, МАФов. Платформа помогает контролировать работу подрядчиков и получать аналитические отчёты в режиме реального времени.',
	},
	{
		question: 'Какие основные модули есть в платформе?',
		answer:
			'Платформа включает модули для инвентаризации мест захоронений на кладбищах, учёта и паспортизации зелёных насаждений, цифрового лесоустройства, контроля торговых точек и МАФов, управления линиями электропередач (ЛЭП). Каждый модуль имеет мобильное приложение для полевых работ.',
	},
	{
		question: 'Для кого предназначена платформа?',
		answer:
			'Решения Единая среда используются муниципальными службами, управляющими компаниями, МУПами, администрациями городов и районов. Система подходит для всех организаций, которые занимаются управлением территориями и городской инфраструктурой.',
	},
	{
		question: 'Какие преимущества платформы?',
		answer:
			'Платформа включена в реестр отечественного ПО, имеет более 15 лет опыта разработки цифровых решений, комплексную систему аналитики и отчётности, мобильное приложение для полевых работ. Система позволяет оптимизировать процессы учёта, контроля и планирования работ.',
	},
	{
		question: 'Есть ли у платформы мобильное приложение?',
		answer:
			'Да, платформа имеет мобильное приложение для Android и iOS, которое доступно в RuStore и других магазинах приложений. Мобильное приложение позволяет работать с системой в полевых условиях, фиксировать объекты, делать фотографии и заполнять паспорта.',
	},
];

const GradientChevron: React.FC<{ open: boolean; id: string }> = ({ open, id }) => (
	<svg
		width="36"
		height="20"
		viewBox="0 0 36 20"
		fill="none"
		aria-hidden
		className={`shrink-0 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
	>
		<path
			d="M2 3 L18 17 L34 3"
			stroke={`url(#${id})`}
			strokeWidth="5"
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
		<defs>
			<linearGradient id={id} x1="0" y1="0" x2="36" y2="0" gradientUnits="userSpaceOnUse">
				<stop stopColor="#19dfd9" />
				<stop offset="0.5" stopColor="#029eda" />
				<stop offset="1" stopColor="#0c5fe1" />
			</linearGradient>
		</defs>
	</svg>
);

const FaqRow: React.FC<{ item: QA; open: boolean; onToggle: () => void }> = ({
	item,
	open,
	onToggle,
}) => {
	const contentRef = useRef<HTMLDivElement | null>(null);
	const [h, setH] = useState(0);
	const gradId = useId();
	const panelId = useId();

	useEffect(() => {
		const el = contentRef.current;
		if (!el) return;
		const measure = () => setH(el.scrollHeight);
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	return (
		<div
			className={`rounded-[20px] border border-[#029cda]/50 bg-white transition-shadow ${
				open ? 'shadow-[0px_4px_13px_0px_rgba(0,0,0,0.18)]' : ''
			}`}
		>
			<button
				type="button"
				aria-controls={panelId}
				aria-expanded={open}
				onClick={onToggle}
				className="flex w-full items-center justify-between gap-6 p-6 text-left sm:p-8"
			>
				<span className="text-[clamp(1.15rem,1.9vw,1.875rem)] font-medium leading-snug text-black">
					{item.question}
				</span>
				<GradientChevron open={open} id={gradId} />
			</button>

			<div
				id={panelId}
				role="region"
				style={{ height: open ? h : 0 }}
				className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
			>
				<div
					ref={contentRef}
					className={`px-6 pb-6 text-[clamp(1rem,1.15vw,1.25rem)] leading-relaxed text-[#5a6072] transition-[opacity,transform] duration-300 sm:px-8 sm:pb-8 ${
						open ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
					}`}
				>
					{item.answer}
				</div>
			</div>
		</div>
	);
};

export default function FaqRedesignSection() {
	const [openIndex, setOpenIndex] = useState(0);

	return (
		<section
			className="relative z-10 bg-white px-4 py-16 sm:px-6 lg:py-24"
			style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
			aria-label="Часто задаваемые вопросы"
		>
			<div className="mx-auto max-w-[1030px]">
				{/* Заголовок */}
				<h2 className="font-bebas text-center text-[#029eda] uppercase leading-none tracking-wide text-[clamp(2.5rem,6vw,6.25rem)]">
					Часто задаваемые вопросы
				</h2>

				{/* Аккордеон */}
				<div className="mt-10 space-y-4 lg:mt-14">
					{FAQ_ITEMS.map((item, i) => (
						<FaqRow
							key={i}
							item={item}
							open={openIndex === i}
							onToggle={() => setOpenIndex((idx) => (idx === i ? -1 : i))}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
