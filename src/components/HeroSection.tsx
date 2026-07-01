'use client';

import React from 'react';
import Image from 'next/image';
import { useModal } from './ModalProvider';

const HeroSection: React.FC = () => {
	const { openRegister, openDemo } = useModal();

	return (
		<section className="w-full overflow-hidden bg-gradient-to-bl from-[#029eda]/80 to-[#0c5fe1] -mt-[88px] pt-[88px]">
			<div className="rd-content-column py-10 md:py-14 lg:py-[66px]">
				<div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-6">
					{/* Текст и кнопки */}
					<div className="flex-1 lg:max-w-[662px] lg:pt-[66px] flex flex-col">
						<h1 className="font-involve text-white text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px]">
							Цифровое управление
							<br />
							территориями
						</h1>

						<p className="mt-6 md:mt-8 text-white/80 text-lg md:text-[22.7px] leading-[1.37] max-w-[662px] font-[Inter]">
							Платформа для эффективного учёта, управления и мониторинга территорий и объектов в
							организациях любого типа и масштаба
						</p>

						<div className="mt-8 md:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-2">
							<button
								type="button"
								onClick={() => openRegister()}
								className="inline-flex items-center justify-center h-[54px] min-w-[200px] sm:min-w-[232px] px-8 rounded-lg bg-white/20 backdrop-blur-sm border border-white/40 text-white text-base md:text-[19px] font-semibold font-[Inter] hover:bg-white/30 transition-colors"
							>
								Оставить заявку
							</button>
							<button
								type="button"
								onClick={() => openDemo()}
								className="inline-flex items-center justify-center h-[54px] min-w-[180px] sm:min-w-[188px] px-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/60 text-white text-base md:text-[19px] font-semibold font-[Inter] hover:bg-white/20 transition-colors"
							>
								Демоверсия
							</button>
						</div>
					</div>

					{/* Иллюстрация */}
					<div className="relative w-full lg:w-[415px] lg:shrink-0 lg:ml-auto aspect-[396/396] max-h-[396px] overflow-hidden">
						<Image
							src="/img/hero-home.webp"
							alt="Платформа АИС Единая среда"
							fill
							priority
							className="object-cover object-left-top"
							sizes="(max-width: 1024px) 100vw, 515px"
						/>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;
