'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { CaseItem, sb_listCases } from '@/lib/blogStore';
import { resolveCaseCover } from '@/lib/caseCover';

/**
 * CasesRedesignSection — редизайн блока кейсов только для тестовой страницы /test.
 * Данные — те же реальные кейсы (sb_listCases), что и в HomeCases.
 * Карточка: обложка с подписью города поверх + заголовок под ней.
 * Заголовок секции — Bebas Neue Cyrillic, тело — Raleway. Слайдер со стрелками снизу.
 */

let _casesCache: CaseItem[] | null = null;

function LineArrow({ dir }: { dir: 'left' | 'right' }) {
	return (
		<svg width="46" height="20" viewBox="0 0 46 20" fill="none" aria-hidden>
			<path
				d={dir === 'right' ? 'M2 10h40m0 0-9-8m9 8-9 8' : 'M44 10H4m0 0 9-8m-9 8 9 8'}
				stroke="currentColor"
				strokeWidth="5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

export default function CasesRedesignSection() {
	const [cases, setCases] = useState<CaseItem[]>(_casesCache || []);
	const scrollerRef = useRef<HTMLDivElement>(null);
	const [canLeft, setCanLeft] = useState(false);
	const [canRight, setCanRight] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const data = await sb_listCases();
				const sorted = [...data].sort((a, b) => b.createdAt - a.createdAt);
				_casesCache = sorted;
				setCases(sorted);
			} catch {
				setCases([]);
			}
		})();
	}, []);

	const updateArrows = useCallback(() => {
		const el = scrollerRef.current;
		if (!el) return;
		setCanLeft(el.scrollLeft > 8);
		setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
	}, []);

	useEffect(() => {
		updateArrows();
		const onResize = () => updateArrows();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, [cases, updateArrows]);

	const scrollByCard = (dir: 1 | -1) => {
		const el = scrollerRef.current;
		if (!el) return;
		const card = el.querySelector<HTMLElement>('[data-card]');
		const step = card ? card.offsetWidth + 24 : 514;
		el.scrollBy({ left: dir * step, behavior: 'smooth' });
	};

	if (!cases.length) return null;

	const showArrows = canLeft || canRight;

	return (
		<section
			className="relative z-10 overflow-hidden bg-white px-4 py-16 sm:px-6 lg:py-24"
			style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
			aria-label="Реализованные проекты"
		>
			<div className="mx-auto max-w-[1600px]">
				{/* Заголовок */}
				<h2 className="font-bebas text-center text-[#029eda] uppercase leading-none tracking-wide text-[clamp(2.5rem,6vw,6.25rem)]">
					Реализованные проекты
				</h2>

				{/* Слайдер */}
				<div
					ref={scrollerRef}
					onScroll={updateArrows}
					className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 lg:mt-14 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				>
					{cases.map((item) => {
						const cover = resolveCaseCover(item.cover, item.contentHtml);
						return (
							<Link
								key={item.id}
								href={`/cases/${item.slug}`}
								data-card
								className="group flex w-[300px] shrink-0 snap-start flex-col rounded-[20px] bg-white p-[18px] shadow-[0px_4px_13px_0px_rgba(0,0,0,0.18)] sm:w-[400px] sm:p-[22px] lg:w-[490px] lg:p-[30px]"
							>
								{/* Обложка + город */}
								<div className="relative aspect-[430/235] w-full overflow-hidden rounded-[20px] bg-[#ebebeb]">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={cover}
										alt={item.title}
										className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
										loading="lazy"
										draggable={false}
									/>
									{/* затемнение снизу под подпись */}
									<div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
									{item.location && (
										<span className="absolute bottom-4 left-5 text-[clamp(1.4rem,2vw,1.875rem)] font-bold leading-tight text-white drop-shadow">
											{item.location}
										</span>
									)}
								</div>

								{/* Заголовок кейса */}
								<h3 className="mt-6 text-[clamp(1.1rem,1.3vw,1.5rem)] leading-snug text-black group-hover:text-[#029eda]">
									{item.title}
								</h3>
							</Link>
						);
					})}
				</div>

				{/* Пагинация — стрелки + точка */}
				{showArrows && (
					<div className="mt-10 flex items-center justify-center gap-6 text-[#029eda]">
						<button
							type="button"
							onClick={() => scrollByCard(-1)}
							disabled={!canLeft}
							aria-label="Предыдущие проекты"
							className="transition-opacity disabled:opacity-30 hover:opacity-70"
						>
							<LineArrow dir="left" />
						</button>
						<span aria-hidden className="h-6 w-6 rounded-full bg-[#029eda]" />
						<button
							type="button"
							onClick={() => scrollByCard(1)}
							disabled={!canRight}
							aria-label="Следующие проекты"
							className="transition-opacity disabled:opacity-30 hover:opacity-70"
						>
							<LineArrow dir="right" />
						</button>
					</div>
				)}
			</div>
		</section>
	);
}
