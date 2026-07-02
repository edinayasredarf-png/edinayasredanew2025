'use client';

import React from 'react';
import Image from 'next/image';
import { useModal } from './ModalProvider';

const HeroSection: React.FC = () => {
	const { openRegister, openConsult } = useModal();

	return (
		<section className="w-full overflow-hidden bg-gradient-to-bl from-[#029eda]/50 to-[#0c5fe1]">
			<div className="relative mx-auto max-w-[1400px] min-h-[580px] lg:min-h-[660px] flex items-stretch">

				{/* Текст и кнопки — левая колонка */}
				<div className="relative z-10 flex flex-col justify-center w-full lg:max-w-[620px] xl:max-w-[680px] px-6 sm:px-10 lg:px-16 py-16 lg:py-[80px]">
					<h1 className="font-involve text-white text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.14] tracking-[0.6px]">
						Цифровое управление
						<br />
						территориями
					</h1>

					<p className="mt-8 text-white/70 text-lg md:text-[22.7px] leading-[1.37] max-w-[580px]">
						Платформа для эффективного учёта, управления и мониторинга территорий и объектов в организациях любого типа и масштаба
					</p>

					<div className="mt-10 flex flex-wrap gap-3">
						<button
							type="button"
							onClick={() => openRegister()}
							className="inline-flex items-center justify-center h-[54px] min-w-[232px] px-8 rounded-xl bg-white text-[#029cda] text-[19px] font-semibold font-involve hover:bg-white/90 transition-colors"
						>
							Оставить заявку
						</button>
						<button
							type="button"
							onClick={() => openConsult()}
							className="inline-flex items-center justify-center h-[54px] min-w-[188px] px-8 rounded-xl border border-white text-white text-[19px] font-semibold font-involve hover:bg-white/10 transition-colors"
						>
							Консультация
						</button>
					</div>
				</div>

				{/* Изображение — правая колонка, прижато к низу */}
				<div className="hidden lg:flex flex-1 items-end justify-end pointer-events-none select-none">
					<Image
						src="/img/hero-tablet.webp"
						alt="Платформа АИС Единая среда"
						width={760}
						height={660}
						priority
						className="object-contain object-bottom max-h-[660px] w-auto"
						sizes="(max-width: 1400px) 50vw, 700px"
					/>
				</div>

			</div>
		</section>
	);
};

export default HeroSection;
