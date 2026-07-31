// app/system/page.tsx
// Лендинг АИС «Единая среда» (новый дизайн). Пока noindex — дубль главной.

import { Metadata } from 'next';
import TestHomePage from './TestHomePage';

export const metadata: Metadata = {
	title: 'АИС «Единая среда» — цифровая платформа для управления территориями',
	description:
		'Единая цифровая платформа для инвентаризации и учёта городских территорий: зелёные насаждения, места захоронений, объекты благоустройства. Контроль подрядчиков, аналитика и мобильное приложение в одной системе.',
	robots: {
		index: false,
		follow: false,
	},
};

export default function Page() {
	return <TestHomePage />;
}
