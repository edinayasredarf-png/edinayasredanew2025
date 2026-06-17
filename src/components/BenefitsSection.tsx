'use client';

import React from 'react';
import { useModal } from './ModalProvider';

type Benefit = { title: string; desc: string };

const ITEMS: Benefit[] = [
	{
		title: 'Выгода на содержание',
		desc: 'система способствует эффективному планированию муниципального бюджета',
	},
	{
		title: 'Экономия на оцифровке',
		desc: 'проведение повторной инвентаризации и ввод данных самостоятельно',
	},
	{
		title: 'Адаптация сотрудников',
		desc: 'Вся необходимая документация сосредоточена в единой системе',
	},
	{
		title: 'Быстрое внедрение системы',
		desc: 'в течение 1 рабочего дня',
	},
	{
		title: 'Снижение рисков срывов государственных контрактов до 0',
		desc: 'контроль подрядчиков и актуализация данных в онлайн режиме',
	},
	{
		title: 'Одна программа для всех решений',
		desc: 'все объекты городской среды и необходимые документы в едином поле',
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
		<section className="bg-[#F6F7F9] w-full py-10 md:py-14 lg:py-16" aria-label="Преимущества системы">
			<div className="rd-content-column">
				{showTitle && (
					<header className="text-center max-w-[950px] mx-auto mb-10 md:mb-12 lg:mb-14">
						<h2 className="font-involve text-[#313131] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] md:leading-[55px]">
							6 веских причин зарегистрироваться
							<br />
							в системе <span className="text-[#029cda]">Единая среда</span>
						</h2>
					</header>
				)}

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-2.5">
					{ITEMS.map((item, idx) => (
						<article
							key={item.title}
							className={`rd-block rounded-2xl p-6 min-h-[150px] flex flex-col ${
								idx < 3 ? 'opacity-80' : ''
							}`}
						>
							<h3 className="text-base font-semibold leading-6 text-[#313131] font-[Raleway]">
								{item.title}
							</h3>
							<p className="mt-2.5 text-[15px] leading-6 text-[#7c8a9a] font-[Raleway]">
								{item.desc}
							</p>
						</article>
					))}
				</div>

				<div className="mt-10 md:mt-12 flex justify-center">
					<button
						type="button"
						onClick={onRegisterClick ?? openRegister}
						className="w-full sm:w-auto sm:min-w-[280px] lg:w-[394px] inline-flex items-center justify-center px-5 py-3.5 rounded-lg bg-[#029cda] hover:bg-[#0288bd] transition-colors text-white text-lg md:text-xl font-medium leading-7 font-[Raleway]"
					>
						{ctaText}
					</button>
				</div>
			</div>
		</section>
	);
}
