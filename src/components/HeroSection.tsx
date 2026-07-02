'use client';

import React from 'react';
import { useModal } from './ModalProvider';

const HeroSection: React.FC = () => {
	const { openRegister, openConsult } = useModal();

	return (
		<section className="w-full overflow-hidden bg-gradient-to-bl from-[#029eda]/50 to-[#0c5fe1] -mt-[80px]">
			<div className="relative mx-auto w-full max-w-[1200px] flex flex-col lg:flex-row lg:items-stretch px-6 lg:px-0">

				{/* Текст и кнопки — левая колонка, от левого края 1200px */}
				<div className="relative z-10 flex flex-col justify-center shrink-0 lg:w-[460px] xl:w-[490px] lg:pl-0 lg:pr-8 pt-[120px] pb-10 lg:pt-[160px] lg:pb-[80px]">
					<h1 className="font-involve text-white text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.14] tracking-[0.6px]">
						Цифровое управление
						<br />
						территориями
					</h1>

					<p className="mt-6 text-white/70 text-[15px] md:text-[16px] leading-[1.55] font-semibold max-w-[420px]">
						Платформа для эффективного учёта, управления и мониторинга территорий и объектов в организациях любого типа и масштаба
					</p>

					<div className="mt-10 flex flex-wrap gap-3">
						<button
							type="button"
							onClick={() => openRegister()}
							className="inline-flex items-center justify-center h-[54px] min-w-[200px] px-8 rounded-xl bg-white text-[#029cda] text-[19px] font-semibold font-involve hover:bg-white/90 transition-colors"
						>
							Оставить заявку
						</button>
						<button
							type="button"
							onClick={() => openConsult()}
							className="inline-flex items-center justify-center h-[54px] min-w-[160px] px-8 rounded-xl border border-white text-white text-[19px] font-semibold font-involve hover:bg-white/10 transition-colors"
						>
							Консультация
						</button>
					</div>
				</div>

				{/* Изображение — правая колонка, прижато к правому краю 1200px и к низу */}
				<div className="flex flex-1 items-end justify-center lg:justify-end pointer-events-none select-none pb-0 lg:pr-0 -mx-6 lg:mx-0">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/img/hero-tablet.webp"
						alt="Платформа АИС Единая среда"
						className="w-full lg:w-auto lg:max-h-[800px] xl:max-h-[840px] object-contain object-bottom"
						loading="eager"
					/>
				</div>

			</div>
		</section>
	);
};

export default HeroSection;
