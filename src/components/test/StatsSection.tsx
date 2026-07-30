'use client';

import React from 'react';

/**
 * StatsSection — «Цифры о нас».
 * Градиентная карточка с ключевыми показателями (крупные цифры — Bebas Neue)
 * и рядом логотипов партнёров снизу. Логотипы — те же, что в SupportersSection.
 */

type Stat = {
	/** Приставка перед числом, напр. «>». */
	prefix?: string;
	/** Основное число. */
	value: string;
	/** Суффикс после числа, напр. «+» или «млн+». */
	suffix?: string;
	/** Подпись под числом. */
	label: string;
};

const STATS: Stat[] = [
	{ value: '40', suffix: '+', label: 'регионов РФ уже пользуются сервисом' },
	{ value: '100', suffix: 'млн+', label: 'инвентаризованных объектов' },
	{ value: '500', suffix: '+', label: 'реализованных проектов' },
	{ prefix: '>', value: '200', label: 'компаний ежемесячно пользуются платформой' },
	{ value: '2000', label: 'паспортов создано пользователями' },
];

type Logo = { src: string; alt: string };

const LOGOS: Logo[] = [
	{ src: '/img/logos/skolkovo.svg', alt: 'Сколково' },
	{ src: '/img/logos/mincifry.svg', alt: 'Минцифры' },
	{ src: '/img/logos/asi.svg', alt: 'АСИ' },
	{ src: '/img/logos/fasie1.svg', alt: 'ФАСИИ' },
	{ src: '/img/logos/frii_logo.svg', alt: 'ФРИИ' },
	{ src: '/img/logos/minstroy.svg', alt: 'Минстрой' },
];

const StatCard: React.FC<{ stat: Stat }> = ({ stat }) => (
	<div className="w-[300px] max-w-full text-center text-white">
		<div className="font-bebas flex items-end justify-center leading-none">
			{stat.prefix && (
				<span className="pb-1 text-[clamp(2.2rem,4vw,4.4rem)]">{stat.prefix}</span>
			)}
			<span className="text-[clamp(4.5rem,9vw,9.4rem)]">{stat.value}</span>
			{stat.suffix && (
				<span className="pb-2 text-[clamp(2.2rem,4vw,4.4rem)]">{stat.suffix}</span>
			)}
		</div>
		<p
			className="mx-auto mt-1 max-w-[280px] text-[clamp(1.05rem,1.4vw,1.5rem)] font-light leading-tight"
			style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
		>
			{stat.label}
		</p>
	</div>
);

const StatsSection: React.FC = () => {
	return (
		<section className="relative z-10 w-full overflow-hidden bg-gradient-to-br from-[#19dfd9] via-[#029eda] to-[#0c5fe1] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
			<div className="mx-auto max-w-[1600px]">
				{/* Заголовок */}
				<h2 className="font-bebas text-center text-white uppercase leading-none tracking-wide text-[clamp(2.75rem,7vw,7rem)]">
					Цифры о нас
				</h2>

				{/* Показатели */}
				<div className="mt-12 flex flex-wrap justify-center gap-x-10 gap-y-12 lg:mt-16 lg:gap-x-20">
					{STATS.map((s) => (
						<StatCard key={s.label} stat={s} />
					))}
				</div>

				{/* Логотипы партнёров */}
				<div className="mt-14 flex flex-wrap items-center justify-center gap-4 sm:gap-5 lg:mt-20">
					{LOGOS.map((logo) => (
						<div
							key={logo.alt}
							className="flex h-[100px] w-[180px] items-center justify-center rounded-[15px] bg-white p-4 shadow-[2px_4px_8px_0px_rgba(0,0,0,0.25)]"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={logo.src}
								alt={logo.alt}
								className="h-full w-full object-contain"
								loading="lazy"
								draggable={false}
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default StatsSection;
