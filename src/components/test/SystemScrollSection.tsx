'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * SystemScrollSection — секция «Платформа изнутри».
 * Три макета MacBook с интерфейсом системы сменяют друг друга кроссфейдом
 * (автоплей + точки пагинации), по тому же принципу, что и слайдер в Hero.
 */

type MacSlide = {
	image: string;
	alt: string;
};

const SLIDES: MacSlide[] = [
	{ image: '/img/hero-test/mac1.webp', alt: 'Карта с паспортом объекта зелёных насаждений' },
	{ image: '/img/hero-test/mac2.webp', alt: 'Карта территории кладбища с реестром ограждений' },
	{ image: '/img/hero-test/mac3.webp', alt: 'Интерфейс платформы «Единая среда»' },
];

const AUTOPLAY_MS = 6500;

const SystemScrollSection: React.FC = () => {
	const [active, setActive] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const [paused, setPaused] = useState(false);

	const go = useCallback((i: number) => setActive((i + SLIDES.length) % SLIDES.length), []);

	// Автопрокрутка (стоп при наведении и при prefers-reduced-motion).
	useEffect(() => {
		const reduce =
			typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduce || paused) return;
		timerRef.current = setInterval(() => setActive((v) => (v + 1) % SLIDES.length), AUTOPLAY_MS);
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [paused]);

	return (
		<section className="relative z-10 -mt-[1px] overflow-hidden rounded-t-[50px] bg-white">
			<div className="mx-auto max-w-[1600px] px-5 pt-14 pb-16 lg:pt-20 lg:pb-24">
				{/* Слайдер макбуков (кроссфейд) */}
				<div
					className="relative mx-auto w-full max-w-[1500px]"
					onMouseEnter={() => setPaused(true)}
					onMouseLeave={() => setPaused(false)}
					aria-roledescription="carousel"
				>
					<div className="relative aspect-[1085/661] w-full">
						{SLIDES.map((s, i) => (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								key={s.image}
								src={s.image}
								alt={i === active ? s.alt : ''}
								className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-[1000ms] ease-out ${
									i === active ? 'opacity-100' : 'opacity-0'
								}`}
								loading={i === 0 ? 'eager' : 'lazy'}
								draggable={false}
							/>
						))}
					</div>

					{/* Пагинация */}
					<div className="mt-6 flex items-center justify-center gap-2.5" role="tablist" aria-label="Слайды">
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
										: 'w-2.5 bg-gray-300 hover:bg-gray-400'
								}`}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

export default SystemScrollSection;
