


import type { Metadata } from 'next';
import Script from 'next/script';


export const metadata: Metadata = {
	title: 'Инвентаризация зеленых насаждений  в Волгодонске под ключ с созданием цифрового реестра',
	description: 'Профессиональная инвентаризация деревьев и зелёных насаждений в Волгодонске: ГИС-учёт, аналитика, паспорта объектов.  Соответствие требованиям и высокая точность.',
	alternates: { canonical: '/services/izn/volgodonsk' },
	openGraph: {
		title: 'Инвентаризация зеленых насаждений в Волгодонске — Единая среда',
		description: 'Полный учёт зелёных зон в Волгодонске: координаты, атрибуты, аналитика в ГИС.',
		url: '/services/izn/volgodonsk',
		type: 'article',
		images: [{ url: '/img/услуга_изн.png', width: 1200, height: 630, alt: 'Инвентаризация зеленых насаждений' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Инвентаризация зеленых насаждений в Волгодонске Единая среда',
		description: 'Профессиональная инвентаризация зеленых насаждений в Волгодонске: точные данные и аналитика.',
		images: ['/img/услуга_изн.png'],
	},
};

export default function ServicesInventoryLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			{children}

			{/* JSON-LD для Google Rich Snippet — SoftwareApplication */}
			<Script id="json-ld-software" type="application/ld+json">
				{JSON.stringify({
					"@context": "https://schema.org",
					"@type": "SoftwareApplication",
					name: "АИС «Единая среда»",
					applicationCategory: "BusinessApplication",
					operatingSystem: "Web",
					url: "https://единаясреда.рф/services/izn/volgodonsk",
					screenshot: "https://единаясреда.рф/img/услуга_изн.png",
					description: "Инвентаризация зеленых насаждений в Волгодонске с созданием цифрового реестра. Сбор, оцифровка и аналитика данных, соответствие требованиям законодательства.",
					offers: {
						"@type": "Offer",
						price: "0",
						priceCurrency: "RUB",
						url: "https://единаясреда.рф/services/izn/volgodonsk"
					},
					featureList: [
						"Электронная карта зеленых насаждений",
						"Цифровой реестр зеленых насаждений",
						"Удобный поиск для граждан",
						"Соответствие законодательным требованиям"
					]
				})}
			</Script>

			{/* FAQ JSON-LD */}
			<Script id="json-ld-faq" type="application/ld+json">
				{JSON.stringify({
					"@context": "https://schema.org",
					"@type": "FAQPage",
					mainEntity: [
						{
							"@type": "Question",
							name: "Обязательна ли инвентаризация зеленых насаждений?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Во многих регионах учет зеленого фонда является частью системы управления территориями и необходим для корректной эксплуатации объектов."
							}
						},
						{
							"@type": "Question",
							name: "Как часто нужно проводить инвентаризацию?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Рекомендуется обновлять данные каждые несколько лет или после значительных изменений территории."
							}
						},
						{
							"@type": "Question",
							name: "Что получает заказчик по итогам работ?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Цифровую базу насаждений, карту, паспорта объектов и комплект отчетной документации"
							}
						}
					]
				})}
			</Script>
		</>
	);
}