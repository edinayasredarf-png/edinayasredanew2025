"use client";

import React, { useState } from "react";

export interface FAQItem {
	question: string;
	answer: string;
}

export interface FAQProps {
	items?: FAQItem[]; // необязательные, дефолтные есть
	title?: string;
	showContactCard?: boolean;
	contactCardTitle?: string;
	contactCardText?: string;
	contactButtonText?: string;
}

const defaultFAQ: FAQItem[] = [
	{
		question: "Что включает инвентаризация мест захоронений?",
		answer:
			"Инвентаризация включает анализ архивных данных, полевые обследования территорий, GPS-съемку, фотофиксацию и создание цифрового реестра мест захоронений."
	},
	{
		question: "Зачем муниципалитету проводить оцифровку кладбищ?",
		answer:
			"Цифровой реестр позволяет точно учитывать захоронения, планировать развитие территорий, снижать ручной труд сотрудников и повышать прозрачность учета."
	},
	{
		question: "Соответствует ли система государственным требованиям?",
		answer:
			"Да. Работы выполняются с учетом действующих нормативов и требований, а также с возможностью интеграции в региональные и государственные информационные системы."
	},
	{
		question: "Сколько времени занимает инвентаризация кладбища?",
		answer:
			"Сроки зависят от площади территории, состояния архивов и количества захоронений. После консультации мы готовим индивидуальный план работ."
	},
	{
		question: "Можно ли интегрировать данные в существующие системы учета?",
		answer:
			"Да. Мы обеспечиваем перенос данных и интеграцию с муниципальными и ведомственными платформами."
	}
];

export default function FAQService({
	items = defaultFAQ,
	title = "Часто задаваемые вопросы",
	showContactCard = false,
	contactCardTitle = "",
	contactCardText = "",
	contactButtonText = ""
}: FAQProps) {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	// JSON-LD для SEO
	const faqSchema = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: items.map((item) => ({
			"@type": "Question",
			name: item.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: item.answer
			}
		}))
	};

	return (
		<section className="max-w-[880px] mx-auto px-4 py-24">
			{/* JSON-LD для Google */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
			/>

			<h2 className="text-center text-[#313131] text-4xl md:text-[52px] font-medium leading-tight mb-12">
				{title}
			</h2>

			<div className="flex flex-col gap-4">
				{items.map((faq, index) => {
					const isOpen = openIndex === index;

					return (
						<div
							key={index}
							className="bg-white rounded-2xl p-6 cursor-pointer "
							onClick={() => setOpenIndex(isOpen ? null : index)}
						>
							<div className="flex justify-between items-center gap-6">
								<h3 className="text-[#313131] text-lg md:text-xl font-medium">
									{faq.question}
								</h3>
								<div
									className={`text-2xl  font-medium text-[#313131] transition-transform ${isOpen ? "rotate-45" : ""}`}
								>
									+
								</div>
							</div>

							{isOpen && (
								<p className="mt-4 text-[#7c8a9a] text-lg leading-relaxed">
									{faq.answer}
								</p>
							)}
						</div>
					);
				})}
			</div>

			{/* Контактная карточка */}
			{showContactCard && (
				<div className="mt-12 bg-[#f6f7f9] rounded-2xl p-8 text-center flex flex-col items-center gap-4">
					{contactCardTitle && (
						<h3 className="text-[#313131] text-2xl font-medium">{contactCardTitle}</h3>
					)}
					{contactCardText && (
						<p className="text-[#7c8a9a] text-lg">{contactCardText}</p>
					)}
					{contactButtonText && (
						<button className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
							{contactButtonText}
						</button>
					)}
				</div>
			)}
		</section>
	);
}
