'use client';

import React from 'react';

/**
 * WhyChooseSection — «Почему нас выбирают уже более 15 лет».
 * Три карточки: реестр отечественного ПО, добросовестный подрядчик, резидент Сколково.
 * Иконка сверху справа, описание, кнопка снизу. Заголовок — Bebas, тело — Raleway.
 * Ссылки кнопок пока не заданы (destinations нужно подставить).
 */

type Card = {
	icon: string;
	title: React.ReactNode;
	text: string;
	cta: string;
	href?: string;
};

const CARDS: Card[] = [
	{
		icon: '/img/15let/1.webp',
		title: 'Входит в реестр отечественного ПО',
		text: 'АИС «Единая среда» внесена в реестр отечественного ПО и полностью соответствует требованиям, предъявляемым к российскому программному обеспечению',
		cta: 'посмотреть',
		href: 'https://reestr.digital.gov.ru/reestr/685429/',
	},
	{
		icon: '/img/15let/2.webp',
		title: 'Добросовестный подрядчик по 44 и 223-ФЗ',
		text: 'Компании ООО «Сфера» и ООО «Экострой», входящие в состав ГК «Единая среда», более 15 лет успешно выполняют контракты государственные и коммерческие, доказывая свою надёжность и высокое качество работ',
		cta: 'подробнее о проектах',
		href: 'https://www.tbank.ru/business/contractor/legal/1106195006378/contracts/1/',
	},
	{
		icon: '/img/15let/3.webp',
		title: 'Резидент Сколково',
		text: 'Статус резидента «Сколково» подтверждают инновационный подход компании и соответствие высоким стандартам развития цифровых решений',
		cta: 'узнать подробнее',
		href: 'https://ytevoelicxcecwpetcqj.supabase.co/storage/v1/object/public/docs/Vipiska_iz_reestra_udach_uchastnikov_proekta_Skolkovo_SFERA.pdf',
	},
];

const CardButton: React.FC<{ card: Card }> = ({ card }) => {
	const cls =
		'mt-auto flex h-[54px] w-full items-center justify-center rounded-lg bg-[#029eda]/50 px-6 text-lg font-bold uppercase leading-tight tracking-wide text-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#029eda]';
	if (card.href) {
		return (
			<a href={card.href} target="_blank" rel="noopener noreferrer" className={cls}>
				{card.cta}
			</a>
		);
	}
	return (
		<button type="button" className={cls}>
			{card.cta}
		</button>
	);
};

const WhyChooseSection: React.FC = () => {
	return (
		<section
			className="relative z-10 bg-white px-4 py-16 sm:px-6 lg:py-24"
			style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
		>
			<div className="mx-auto max-w-[1500px]">
				{/* Заголовок */}
				<h2 className="font-bebas mx-auto max-w-[1100px] text-center text-[#029eda] uppercase leading-none tracking-wide text-[clamp(2.4rem,6vw,6.25rem)]">
					Почему нас выбирают уже более 15 лет
				</h2>

				{/* Карточки */}
				<div className="mt-10 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-3 lg:gap-8">
					{CARDS.map((card, i) => (
						<article
							key={i}
							className="flex flex-col rounded-[20px] bg-white p-8 shadow-[0px_4px_13px_0px_rgba(0,0,0,0.18)]"
						>
							{/* Заголовок + иконка */}
							<div className="flex items-start justify-between gap-4">
								<h3 className="max-w-[300px] text-[clamp(1.4rem,1.9vw,1.875rem)] font-bold leading-tight text-black">
									{card.title}
								</h3>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={card.icon}
									alt=""
									className="h-[100px] w-auto shrink-0 object-contain"
									loading="lazy"
									draggable={false}
								/>
							</div>

							<p className="mt-8 mb-8 text-[clamp(1.05rem,1.3vw,1.5rem)] leading-relaxed text-[#1a1a1a]">
								{card.text}
							</p>

							<CardButton card={card} />
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default WhyChooseSection;
