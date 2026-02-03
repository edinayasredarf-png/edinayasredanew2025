import React from 'react';
import Image from 'next/image';
import Button from './Button';
import { useModal } from './ModalProvider';

interface HeroSectionProps {
	onTestClick?: () => void;
}

const HeroSection: React.FC = () => {
	const { openRegister } = useModal();
	return (
		<section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
				<div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
					{/* Левая часть: текст (шире) */}
					<div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
						<h1 className="text-4xl sm:text-5xl md:text-[72px] font-[Raleway] font-medium leading-tight">
							Цифровое управление<br />территориями
						</h1>
						<p className="mt-8 text-xl sm:text-[27px] text-[#E3E8F2] max-w-2xl font-[Raleway] font-medium">
							Платформа для эффективного учёта, управления и мониторинга территорий и объектов в организациях любого типа и масштаба
						</p>
						<div className="mt-10">
							<Button onClick={openRegister} variant="primary" size="large" className="w-full md:w-auto">
								Стать клиентом
							</Button>
						</div>
					</div>
					{/* Изображение: одно для всех устройств с адаптивными размерами */}
					<div className="flex-1 w-full h-full relative flex justify-center items-end lg:absolute lg:right-0 lg:bottom-[-80px] z-10 lg:w-[40%] lg:max-w-[600px] pointer-events-none">
						<Image
							src="/img/hero.webp"
							alt="Абстрактная иллюстрация цифрового управления"
							width={700}
							height={500}
							className="w-full max-w-[500px] lg:max-w-[600px] object-contain"
							priority
							sizes="(max-width: 1024px) 500px, 600px"
							style={{ height: 'auto' }}
						/>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HeroSection;