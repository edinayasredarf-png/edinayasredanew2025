'use client';

import React from 'react';

/**
 * HowSystemSection — «Кому нужна система».
 * Две карточки: для муниципалитетов/регионов и для бизнеса.
 * Заголовок — Bebas Neue Cyrillic (как на ЖКХ), тело — Raleway.
 */

type ListBlock = {
	/** Вводная строка перед списком. */
	lead: string;
	items: string[];
};

type Card = {
	icon: string;
	iconAlt: string;
	title: string;
	/** Необязательный абзац сразу под заголовком. */
	intro?: string;
	blocks: ListBlock[];
};

const CARDS: Card[] = [
	{
		icon: '/img/how-system/adm.webp',
		iconAlt: 'Иконка «Здание администрации»',
		title: 'Для муниципалитетов и регионов',
		intro: 'Создайте единое цифровое пространство для управления территорией в одной системе.',
		blocks: [
			{
				lead: 'АИС «Единая среда» позволяет:',
				items: [
					'проводить инвентаризацию',
					'хранить данные в актуальном и безопасном состоянии',
					'контролировать подрядчиков',
					'работать с объектами благоустройства',
					'работать с зелёными насаждениями',
					'работать с местами захоронений',
				],
			},
		],
	},
	{
		icon: '/img/how-system/business.webp',
		iconAlt: 'Иконка «Портфель»',
		title: 'Для бизнеса',
		blocks: [
			{
				lead: 'Кому актуальны наши решения:',
				items: [
					'подрядным организациям',
					'управляющим компаниям',
					'девелоперам',
					'санаториям и отелям',
					'промышленным предприятиям',
				],
			},
			{
				lead: 'Система позволяет:',
				items: [
					'вести цифровой учёт объектов',
					'контролировать выполнение работ',
					'формировать отчётность',
				],
			},
			{
				lead: 'Работа с информацией:',
				items: [
					'все данные хранятся в единой системе',
					'доступны с любого устройства',
					'всегда готовы к дальнейшему использованию',
				],
			},
		],
	},
];

const CardBlock: React.FC<{ block: ListBlock }> = ({ block }) => (
	<div className="text-[clamp(1rem,1.25vw,1.35rem)] leading-relaxed text-[#1a1a1a]">
		<p className="font-semibold">{block.lead}</p>
		<ul className="mt-2 space-y-1.5">
			{block.items.map((item) => (
				<li key={item} className="flex gap-2.5">
					<span aria-hidden className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#029eda]" />
					<span>{item}</span>
				</li>
			))}
		</ul>
	</div>
);

const HowSystemSection: React.FC = () => {
	return (
		<section
			className="relative z-10 bg-white px-4 py-16 sm:px-6 lg:py-24"
			style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
		>
			<div className="mx-auto max-w-[1300px]">
				{/* Заголовок */}
				<h2 className="font-bebas text-center text-[#029eda] uppercase leading-none tracking-wide text-[clamp(2.5rem,6.5vw,6.25rem)]">
					Кому нужна система
				</h2>

				{/* Карточки */}
				<div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-8">
					{CARDS.map((card) => (
						<article
							key={card.title}
							className="flex flex-col gap-7 rounded-[20px] bg-white p-8 shadow-[0px_4px_13px_0px_rgba(0,0,0,0.18)] sm:p-10"
						>
							{/* Иконка + заголовок */}
							<div className="flex items-center gap-6 sm:gap-8">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={card.icon}
									alt={card.iconAlt}
									className="h-[100px] w-[100px] shrink-0 object-contain sm:h-[120px] sm:w-[120px]"
									loading="lazy"
									draggable={false}
								/>
								<h3 className="text-[clamp(1.5rem,2.2vw,2rem)] font-bold leading-tight text-black">
									{card.title}
								</h3>
							</div>

							{card.intro && (
								<p className="text-[clamp(1.05rem,1.35vw,1.5rem)] leading-relaxed text-[#1a1a1a]">
									{card.intro}
								</p>
							)}

							{card.blocks.map((block) => (
								<CardBlock key={block.lead} block={block} />
							))}
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default HowSystemSection;
