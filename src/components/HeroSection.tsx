'use client';

import React from 'react';
import { useModal } from './ModalProvider';

const HeroSection: React.FC = () => {
	const { openRegister, openConsult } = useModal();

	return (
		<section className="sticky top-0 z-0 w-full -mt-[80px]">
			<div className="relative w-full overflow-hidden bg-[#029cda]">
				{/* Размытые круги-свечения по бокам */}
				<div
					aria-hidden
					className="hero-orb hero-orb--1 pointer-events-none absolute z-0 -left-[200px] -top-[180px] w-[621px] h-[596px] bg-white/60 rounded-full blur-[150px]"
				/>
				<div
					aria-hidden
					className="hero-orb hero-orb--2 pointer-events-none absolute z-0 -right-[160px] -bottom-[200px] w-[621px] h-[596px] bg-white/60 rounded-full blur-[150px]"
				/>

				<div className="relative z-10 mx-auto w-full max-w-[1200px] flex flex-col lg:flex-row lg:items-stretch px-6 lg:px-5">

				{/* Текст и кнопки — левая колонка, от левого края 1200px */}
				<div className="relative z-10 flex flex-col justify-center shrink-0 lg:w-[600px] xl:w-[662px] lg:pl-0 lg:pr-8 pt-[140px] pb-14 lg:pt-[200px] lg:pb-[120px]">
					<h1
						style={{ fontWeight: 700 }}
						className="font-involve text-white text-[2.4rem] sm:text-[3rem] lg:text-[clamp(2.6rem,4.6vw,3.4rem)] leading-[1.14] tracking-[0.4px] lg:whitespace-nowrap"
					>
						Цифровое управление
						<br />
						территориями
					</h1>

					<p className="mt-6 text-white/75 text-[22px] md:text-[21px] leading-[1.5] font-bold self-stretch">
						Платформа для эффективного учёта, управления и мониторинга территорий и объектов в организациях любого типа и масштаба
					</p>

					<div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
						<button
							type="button"
							onClick={() => openRegister()}
							className="flex items-center justify-center w-full sm:w-auto h-[54px] sm:min-w-[200px] px-8 rounded-xl bg-[#F6F7F9] text-[#029cda] text-[19px] font-semibold font-involve hover:bg-[#F6F7F9]/90 transition-colors"
						>
							Оставить заявку
						</button>
						<button
							type="button"
							onClick={() => openConsult()}
							className="flex items-center justify-center w-full sm:w-auto h-[54px] sm:min-w-[160px] px-8 rounded-xl border border-white text-white text-[19px] font-semibold font-involve hover:bg-[#F6F7F9]/10 transition-colors"
						>
							Консультация
						</button>
					</div>
				</div>

				{/* Изображение — правая колонка, вынос вправо за край 1200px и к низу */}
				<div className="relative flex flex-1 items-end justify-center lg:justify-end pointer-events-none select-none pb-0 lg:pr-0 -mx-6 lg:mx-0">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/img/hero-tablet.webp"
						alt="Платформа АИС Единая среда"
						className="w-full max-w-none lg:w-[720px] xl:w-[820px] object-contain object-bottom lg:-translate-x-16 xl:-translate-x-28"
						loading="eager"
					/>
				</div>

				</div>
			</div>
		</section>
	);
};

export default HeroSection;
