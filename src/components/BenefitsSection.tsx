'use client';

import React from 'react';
import { useModal } from './ModalProvider';

type Benefit = { title: string; desc: string; icon: string };

const ITEMS: Benefit[] = [
	{
		title: 'Выгода на содержание',
		desc: 'система способствует эффективному планированию муниципального бюджета',
		icon: '/img/benefits/1.svg',
	},
	{
		title: 'Экономия на оцифровке',
		desc: 'проведение повторной инвентаризации и ввод данных самостоятельно',
		icon: '/img/benefits/2.svg',
	},
	{
		title: 'Адаптация сотрудников',
		desc: 'Вся необходимая документация сосредоточена в единой системе',
		icon: '/img/benefits/3.svg',
	},
	{
		title: 'Быстрое внедрение системы',
		desc: 'в течение 1 рабочего дня',
		icon: '/img/benefits/4.svg',
	},
	{
		title: 'Снижение рисков срывов государственных контрактов на 99%',
		desc: 'контроль подрядчиков и актуализация данных в онлайн режиме',
		icon: '/img/benefits/5.svg',
	},
	{
		title: 'Облачные базы данных',
		desc: 'Одна программа для всех решений',
		icon: '/img/benefits/6.svg',
	},
];

export default function BenefitsSection({
	onRegisterClick,
	showTitle = true,
	ctaText = 'Зарегистрироваться',
}: {
	onRegisterClick?: () => void;
	showTitle?: boolean;
	ctaText?: string;
}) {
	const { openRegister } = useModal();

	return (
		<section className="bg-white w-full py-16 md:py-24" aria-label="Преимущества системы">
			<div className="rd-content-column">
				{showTitle && (
					<header className="text-center max-w-[950px] mx-auto mb-8 md:mb-10">
						<h2 className="font-involve text-[#313131] text-[32px] md:text-[40px] font-medium leading-[1.2] md:leading-[55px]">
							6 веских причин зарегистрироваться
							<br className="hidden sm:block" />
							{' '}в системе <span className="text-[#029cda]">Единая среда</span>
						</h2>
					</header>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{ITEMS.map((item) => (
						<article
							key={item.title}
							className="bg-[#F6F7F9] rounded-[32px] p-8 lg:p-10 flex items-start gap-4"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={item.icon} alt="" className="w-8 h-8 shrink-0 object-contain mt-0.5" />
							<div>
								<h3 className="font-involve text-[#313131] text-2xl font-medium leading-7 tracking-wide">
									{item.title}
								</h3>
								<p className="mt-3 font-[Raleway] text-base leading-6 text-[#7c8a9a] font-medium">
									{item.desc}
								</p>
							</div>
						</article>
					))}
				</div>

				<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					<button
						type="button"
						onClick={onRegisterClick ?? openRegister}
						className="col-span-1 sm:col-span-2 lg:col-span-1 lg:col-start-2 w-full h-[52px] inline-flex items-center justify-center rounded-2xl bg-[#029cda] hover:bg-[#0288bd] transition-colors text-white text-base font-medium leading-6 tracking-tight font-involve"
					>
						{ctaText}
					</button>
				</div>
			</div>
		</section>
	);
}
