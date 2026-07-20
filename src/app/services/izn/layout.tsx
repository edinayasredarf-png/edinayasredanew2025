


import type { Metadata } from 'next';
import Script from 'next/script';


export const metadata: Metadata = {
	title: 'Инвентаризация зеленых насаждений  под ключ с созданием цифрового реестра',
	description: 'Профессиональная деревьев и зелёных насаждений : ГИС-учёт, аналитика, паспорта объектов.  Соответствие требованиям и высокая точность.',
	alternates: { canonical: '/services/izn' },
	openGraph: {
		title: 'Инвентаризация зеленых насаждений  — Единая среда',
		description: 'Полный учёт зелёных зон : координаты, атрибуты, аналитика в ГИС.',
		url: '/services/izn',
		type: 'article',
		images: [{ url: '/img/услуга_изн.png', width: 1200, height: 630, alt: 'Инвентаризация зеленых насаждений' }],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Инвентаризация зеленых насаждений — Единая среда',
		description: 'Профессиональная инвентаризация зелёных насаждений: цифровые паспорта, ГИС-карта и аналитика.',
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
					url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/services/izn",
					screenshot: "https://xn--80aakbcct4b2aj7m.xn--p1ai/img/услуга_изн.png",
					description: "Инвентаризация зелёных насаждений с созданием цифрового реестра деревьев и кустарников: геопривязка, фотофиксация, цифровые паспорта объектов, ГИС-карта и аналитика. Соответствие требованиям законодательства.",
					offers: {
						"@type": "Offer",
						price: "0",
						priceCurrency: "RUB",
						url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/services/izn"
					},
					featureList: [
						"Цифровой реестр зелёных насаждений",
						"Цифровой паспорт дерева с геопривязкой",
						"ГИС-карта насаждений",
						"Аналитика состояния зелёного фонда"
					]
				})}
			</Script>

			{/* FAQPage JSON-LD генерируется компонентом FAQ внутри FAQSection — здесь не дублируем */}
		</>
	);
}