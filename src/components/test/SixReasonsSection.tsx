'use client';

import React from 'react';
import { PUBLIC_BENEFITS } from '@/lib/publicBenefits';

/**
 * SixReasonsSection — «6 веских причин выбрать АИС «Единая среда»».
 * Шесть карточек в две колонки: иконка + заголовок + описание.
 * Заголовок секции — Bebas Neue Cyrillic, тело — Raleway.
 */


const REASONS = PUBLIC_BENEFITS.map((item, index) => ({ title: item.title, text: item.description, icon: `/img/6prishin/${index + 1}.svg` }));

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
