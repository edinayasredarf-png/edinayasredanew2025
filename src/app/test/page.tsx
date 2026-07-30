// app/test/page.tsx
// Тестовая страница для нового дизайна главной. Не индексируется.

import { Metadata } from 'next';
import TestHomePage from './TestHomePage';

export const metadata: Metadata = {
	title: 'Тест нового дизайна — Единая среда',
	robots: {
		index: false,
		follow: false,
	},
};

export default function Page() {
	return <TestHomePage />;
}
