'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { listPress, PressItem } from '@/lib/pressStore';

/**
 * PressRedesignSection — редизайн блока «СМИ о нас» только для тестовой страницы /test.
 * Данные — те же реальные публикации (listPress), что и в PressSection.
 * Карточка: логотип издания в рамке + дата + заголовок + ссылка «Читать».
 * Заголовок секции — Bebas Neue Cyrillic, тело — Raleway. Слайдер со стрелками снизу.
 */

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

function formatDate(ts: number): string {
	const d = new Date(Number(ts));
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function PressRedesignSection() {
	const [items, setItems] = useState<PressItem[]>([]);
	const [loading, setLoading] = useState(true);

	const scrollerRef = useRef<HTMLDivElement>(null);
	const [canLeft, setCanLeft] = useState(false);
	const [canRight, setCanRight] = useState(false);

	useEffect(() => {
		listPress()
			.then(setItems)
			.catch(() => setItems([]))
			.finally(() => setLoading(false));
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
	}, [items, updateArrows]);

	const scrollByCard = (dir: 1 | -1) => {
		const el = scrollerRef.current;
		if (!el) return;
		const card = el.querySelector<HTMLElement>('[data-card]');
		const step = card ? card.offsetWidth + 24 : 514;
		el.scrollBy({ left: dir * step, behavior: 'smooth' });
	};

	if (!loading && items.length === 0) return null;

	const showArrows = canLeft || canRight;

	return (
		<section
			className="relative z-10 overflow-hidden bg-white px-4 py-16 sm:px-6 lg:py-24"
			style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
			aria-label="СМИ о нас"
		>
			<div className="mx-auto max-w-[1600px]">
				{/* Заголовок */}
				<h2 className="font-bebas text-center text-[#029eda] uppercase leading-none tracking-wide text-[clamp(2.5rem,6vw,6.25rem)]">
					СМИ о нас
				</h2>

				{/* Слайдер */}
				<div
					ref={scrollerRef}
					onScroll={updateArrows}
					className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 lg:mt-14 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				>
					{(loading ? Array.from({ length: 3 }) : items).map((raw, idx) => {
						const item = raw as PressItem | undefined;
						if (loading || !item) {
							return (
								<div
									key={idx}
									data-card
									className="h-[420px] w-[300px] shrink-0 animate-pulse rounded-[20px] bg-[#F1F3F6] sm:w-[400px] lg:w-[490px]"
								/>
							);
						}
						return (
							<a
								key={item.id}
								href={item.link}
								target="_blank"
								rel="noopener noreferrer"
								data-card
								className="group flex w-[300px] shrink-0 snap-start flex-col rounded-[20px] bg-white p-[18px] shadow-[0px_4px_13px_0px_rgba(0,0,0,0.18)] sm:w-[400px] sm:p-[22px] lg:w-[490px] lg:p-[30px]"
							>
								{/* Логотип издания в рамке */}
								<div className="flex aspect-[430/166] w-full items-center justify-center overflow-hidden rounded-[20px] border border-gray-200 bg-white p-6">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={item.source_logo}
										alt={item.source_name}
										className="max-h-full max-w-full object-contain"
										loading="lazy"
										draggable={false}
									/>
								</div>

								{/* Дата */}
								<div className="mt-6 text-[clamp(1.4rem,2vw,1.875rem)] font-bold text-[#212121]">
									{formatDate(item.published_at)}
								</div>

								{/* Заголовок */}
								<p className="mt-3 flex-1 text-[clamp(1.05rem,1.3vw,1.5rem)] leading-snug text-[#212121]">
									{item.title}
								</p>

								{/* Читать */}
								<span className="mt-6 inline-flex w-fit flex-col text-[clamp(1.05rem,1.3vw,1.5rem)] text-[#029cda]">
									Читать
									<span aria-hidden className="mt-0.5 h-px w-[70%] bg-[#029cda]" />
								</span>
							</a>
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
							aria-label="Предыдущие публикации"
							className="transition-opacity hover:opacity-70 disabled:opacity-30"
						>
							<LineArrow dir="left" />
						</button>
						<span aria-hidden className="h-6 w-6 rounded-full bg-[#029eda]" />
						<button
							type="button"
							onClick={() => scrollByCard(1)}
							disabled={!canRight}
							aria-label="Следующие публикации"
							className="transition-opacity hover:opacity-70 disabled:opacity-30"
						>
							<LineArrow dir="right" />
						</button>
					</div>
				)}
			</div>
		</section>
	);
}
