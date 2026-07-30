'use client';

import React from 'react';

/**
 * SixReasonsSection — «6 веских причин выбрать АИС «Единая среда»».
 * Шесть карточек в две колонки: иконка + заголовок + описание.
 * Заголовок секции — Bebas Neue Cyrillic, тело — Raleway.
 */

type Reason = {
	icon: string;
	title: string;
	text: string;
};

const REASONS: Reason[] = [
	{
		icon: '/img/6prishin/1.svg',
		title: 'Выгода на содержание',
		text: 'Система способствует эффективному планированию муниципального бюджета',
	},
	{
		icon: '/img/6prishin/2.svg',
		title: 'Экономия на оцифровке',
		text: 'Проведение повторной инвентаризации и ввод данных самостоятельно',
	},
	{
		icon: '/img/6prishin/3.svg',
		title: 'Адаптация сотрудников',
		text: 'Вся необходимая документация сосредоточена в единой системе',
	},
	{
		icon: '/img/6prishin/4.svg',
		title: 'Быстрое внедрение системы',
		text: 'В течение 1 рабочего дня',
	},
	{
		icon: '/img/6prishin/5.svg',
		title: 'Снижение рисков срывов государственных контрактов до 0',
		text: 'Контроль подрядчиков и актуализация данных в онлайн режиме',
	},
	{
		icon: '/img/6prishin/6.svg',
		title: 'Все объекты — в одной системе',
		text: 'Все объекты городской среды и необходимые документы в едином поле',
	},
];

const SixReasonsSection: React.FC = () => {
	return (
		<section
			className="relative z-10 bg-white px-4 py-16 sm:px-6 lg:py-24"
			style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
		>
			<div className="mx-auto max-w-[1400px]">
				{/* Заголовок */}
				<h2 className="font-bebas mx-auto max-w-[1100px] text-center text-[#029eda] uppercase leading-none tracking-wide text-[clamp(2.4rem,6vw,6.25rem)]">
					6 веских причин выбрать АИС «Единая среда»
				</h2>

				{/* Карточки */}
				<div className="mt-10 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-8">
					{REASONS.map((r) => (
						<article
							key={r.title}
							className="flex items-start gap-6 rounded-[20px] bg-white p-7 shadow-[0px_4px_13px_0px_rgba(0,0,0,0.18)] sm:p-8"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={r.icon}
								alt=""
								className="h-[50px] w-[50px] shrink-0 object-contain sm:h-[56px] sm:w-[56px]"
								loading="lazy"
								draggable={false}
							/>
							<div>
								<h3 className="text-[clamp(1.3rem,1.8vw,1.875rem)] font-bold leading-tight text-black">
									{r.title}
								</h3>
								<p className="mt-3 text-[clamp(1rem,1.3vw,1.5rem)] leading-relaxed text-[#1a1a1a]">
									{r.text}
								</p>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default SixReasonsSection;
