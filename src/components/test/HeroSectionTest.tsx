'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useModal } from '../ModalProvider';

/**
 * HeroSectionTest — герой-слайдер для /test.
 * Полноэкранные 3D-рендеры (город / зелёные насаждения / благоустройство) сменяют
 * друг друга кроссфейдом; заголовок фиксированный, подзаголовок меняется на каждом слайде.
 * Планшет с системой (ContainerScroll) добавляется отдельным шагом ниже секции.
 */

type Slide = {
	image: string;
	alt: string;
	/** Заголовок можно переопределить на конкретном слайде; по умолчанию — общий. */
	title?: string;
	subtitle: string;
};

const DEFAULT_TITLE = 'Цифровое управление территориями';

const SLIDES: Slide[] = [
	{
		image: '/img/hero-test/hero1.webp',
		alt: 'Цифровая модель города с зелёными насаждениями',
		subtitle:
			'Оцифровываем городскую среду: проводим инвентаризацию, собираем геоданные и внедряем единую цифровую платформу для управления территориями',
	},
	{
		image: '/img/hero-test/hero2.webp',
		alt: 'Инвентаризация зелёных насаждений и мест захоронений',
		subtitle:
			'Мы уже более 15 лет делаем инвентаризацию и оцифровку объектов благоустройства, зелёных насаждений и захоронений по всей России',
	},
	{
		image: '/img/hero-test/hero3.webp',
		alt: 'Благоустройство: парк, фонтан и цветники',
		subtitle:
			'«Единая среда» — цифровая экосистема для умных городов: учёт объектов, сбор геоданных и управление территориями в одной платформе',
	},
];

const AUTOPLAY_MS = 6500;

const HeroSectionTest: React.FC = () => {
	const { openRegister, openConsult } = useModal();
	const [active, setActive] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const [paused, setPaused] = useState(false);

	const go = useCallback((i: number) => setActive((i + SLIDES.length) % SLIDES.length), []);

	// Автопрокрутка (останавливается при наведении и при prefers-reduced-motion).
	useEffect(() => {
		const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce || paused) return;
		timerRef.current = setInterval(() => setActive((v) => (v + 1) % SLIDES.length), AUTOPLAY_MS);
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [paused]);

	const slide = SLIDES[active];
	const title = slide.title ?? DEFAULT_TITLE;

	return (
		<section
			className="est-hero relative w-full -mt-[80px] overflow-hidden bg-[#eaf0f5] h-[100svh] min-h-[720px] max-h-[1120px]"
			onMouseEnter={() => setPaused(true)}
			onMouseLeave={() => setPaused(false)}
			aria-roledescription="carousel"
		>
			<style>{estStyles}</style>

			{/* Слои-изображения с кроссфейдом */}
			<div aria-hidden className="absolute inset-0 z-0">
				{SLIDES.map((s, i) => (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						key={s.image}
						src={s.image}
						alt=""
						className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1200ms] ease-out ${
							i === active ? 'opacity-100' : 'opacity-0'
						}`}
						loading={i === 0 ? 'eager' : 'lazy'}
						fetchPriority={i === 0 ? 'high' : 'low'}
						draggable={false}
					/>
				))}
				{/* Лёгкое осветление сверху — чтобы плашка и шапка читались */}
				<div className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-white/45 to-transparent" />
			</div>

			{/* Контент */}
			<div className="relative z-10 mx-auto flex h-full w-full max-w-[1200px] flex-col px-5 pt-[112px] pb-24 lg:pt-[128px]">
				<div className="flex flex-col items-start gap-8 lg:flex-row lg:items-start lg:justify-between">

					{/* Плашка с заголовком и подзаголовком */}
					<div className="w-full max-w-[660px] rounded-[14px] bg-white/80 p-7 shadow-[2px_4px_8px_0px_rgba(0,0,0,0.14)] backdrop-blur-md sm:p-9">
						<h1 className="font-bebas text-[#111] uppercase leading-[0.95] tracking-[0.5px] text-[clamp(2.1rem,6vw,5.6rem)]">
							{title}
						</h1>
						<p
							key={active}
							className="est-subtitle mt-5 max-w-[560px] text-[#1c1c1c]/70 font-semibold leading-[1.34] text-[clamp(1.05rem,1.5vw,1.6rem)]"
							style={{ fontFamily: 'var(--font-geist-sans)' }}
						>
							{slide.subtitle}
						</p>
					</div>

					{/* Кнопки */}
					<div
						className="flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-[320px] lg:flex-col"
						style={{ fontFamily: 'var(--font-geist-sans)' }}
					>
						<button
							type="button"
							onClick={() => openRegister()}
							className="est-btn flex h-[58px] w-full items-center justify-center rounded-lg bg-white text-[#029eda] text-lg font-bold uppercase leading-tight tracking-wide shadow-[2px_4px_8px_0px_rgba(0,0,0,0.2)] hover:bg-white/95"
						>
							Оставить заявку
						</button>
						<button
							type="button"
							onClick={() => openConsult()}
							className="est-btn flex h-[58px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-[#19dfd9] via-[#029eda] to-[#0c5fe1] text-white text-lg font-bold uppercase leading-tight tracking-wide shadow-[0px_4px_10px_0px_rgba(2,158,218,0.35)] hover:brightness-105"
						>
							Узнать подробнее
						</button>
					</div>
				</div>

				{/* Пагинация */}
				<div className="relative z-10 mt-auto flex items-center gap-2.5" role="tablist" aria-label="Слайды">
					{SLIDES.map((s, i) => (
						<button
							key={s.image}
							type="button"
							role="tab"
							aria-selected={i === active}
							aria-label={`Слайд ${i + 1}`}
							onClick={() => go(i)}
							className={`h-2.5 rounded-full transition-all duration-300 ${
								i === active
									? 'w-9 bg-gradient-to-r from-[#19dfd9] to-[#0c5fe1]'
									: 'w-2.5 bg-white/70 hover:bg-white'
							}`}
						/>
					))}
				</div>
			</div>
		</section>
	);
};

const estStyles = `
.est-btn { transition: background .18s ease, filter .18s ease, transform .18s ease, box-shadow .18s ease; }
.est-btn:hover { transform: translateY(-1px); }
.est-subtitle { animation: est-fade-up .5s ease both; }

@keyframes est-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
	.est-btn, .est-subtitle { animation: none; transition: none; }
}
`;

export default HeroSectionTest;
