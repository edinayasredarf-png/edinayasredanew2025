import type { Metadata } from 'next';
import Script from 'next/script';


export const metadata: Metadata = {
	title: 'Инвентаризация мест захоронений и оцифровка кладбищ в Петропавловске-Камчатском под ключ с созданием цифрового реестра',
	description: 'Профессиональная инвентаризация мест захоронений в Петропавловске-Камчатском: сбор, оцифровка и аналитика данных. Соответствие требованиям и высокая точность.',
	alternates: { canonical: '/services/imz/petropavlovsk-kamchatskij' },
	openGraph: {
		title: 'Инвентаризация мест захоронений в Петропавловске-Камчатском — Единая среда',
		description: 'Сбор, оцифровка и аналитика данных о местах захоронений в Петропавловске-Камчатском. Точность и соответствие требованиям.',
		url: '/services/imz/petropavlovsk-kamchatskij',
		type: 'article',
		images: [{ url: '/img/cemetery.png', width: 1200, height: 630, alt: 'Инвентаризация мест захоронений' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Инвентаризация мест захоронений в Петропавловске-Камчатском— Единая среда',
		description: 'Профессиональная инвентаризация кладбищ в Петропавловске-Камчатском: точные данные и аналитика.',
		images: ['/img/cemetery.png'],
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
					url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/services/imz/petropavlovsk-kamchatskij",
					screenshot: "https://xn--80aakbcct4b2aj7m.xn--p1ai/img/cemetery.png",
					description: "Инвентаризация мест захоронений и кладбищ в Петропавловске-Камчатском с созданием цифрового реестра. Сбор, оцифровка и аналитика данных, соответствие требованиям законодательства.",
					offers: {
						"@type": "Offer",
						price: "0",
						priceCurrency: "RUB",
						url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/services/imz/petropavlovsk-kamchatskij"
					},
					featureList: [
						"Электронная карта кладбищ",
						"Цифровой реестр мест захоронений",
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
							name: "Что входит в инвентаризацию кладбищ?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Анализ архивов, полевые обследования, GPS-съемка, фотофиксация и формирование цифровой карты и реестра мест захоронений."
							}
						},
						{
							"@type": "Question",
							name: "Сколько стоит инвентаризация?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Стоимость зависит от площади кладбища, состояния архивов и объема полевых работ. Мы готовим индивидуальный расчет."
							}
						},
						{
							"@type": "Question",
							name: "Можно ли интегрировать данные в государственные системы?",
							acceptedAnswer: {
								"@type": "Answer",
								text: "Да, система готова к интеграции с федеральными и региональными платформами."
							}
						}
					]
				})}
			</Script>
		</>
	);
}