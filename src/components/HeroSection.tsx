'use client';

import React from 'react';
import Image from 'next/image';
import { useModal } from './ModalProvider';

const HeroSection: React.FC = () => {
	const { openRegister, openDemo } = useModal();

	return (
		<section className="bg-white w-full overflow-hidden">
			<div className="rd-content-column py-10 md:py-14 lg:py-[66px]">
				<div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-6">
					{/* Текст и кнопки */}
					<div className="flex-1 lg:max-w-[662px] lg:pt-[66px] flex flex-col">
						<h1 className="font-involve text-[#313131] text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px]">
							Цифровое управление
							<br />
							территориями
						</h1>

						<p className="mt-6 md:mt-8 text-[#313131]/70 text-lg md:text-[22.7px] leading-[1.37] max-w-[662px] font-inter">
							Платформа для эффективного учёта, управления и мониторинга территорий и объектов в
							организациях любого типа и масштаба
						</p>

						<div className="mt-8 md:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-2">
							<button
								type="button"
								onClick={() => openRegister()}
								className="inline-flex items-center justify-center h-[54px] min-w-[200px] sm:min-w-[232px] px-8 rounded-lg bg-[#029cda] text-white text-base md:text-[19px] font-semibold font-inter hover:bg-[#0288bd] transition-colors"
							>
								Оставить заявку
							</button>
							<button
								type="button"
								onClick={() => openDemo()}
								className="inline-flex items-center justify-center h-[54px] min-w-[180px] sm:min-w-[188px] px-8 rounded-lg border border-[#029cda] text-[#029cda] text-base md:text-[19px] font-semibold font-inter hover:bg-[#029cda]/5 transition-colors"
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
