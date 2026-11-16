import type { Metadata } from 'next';
import { StatovPortfolio } from './portfolio';

const title = 'Андрей Статов — предприниматель и создатель';
const description = 'Проекты Андрея Статова на стыке экологии, цифровых технологий и сохранения исторической памяти. Единая Среда, MyRoots и Экострой.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/statov' },
  openGraph: { title, description, url: '/statov', type: 'website', images: ['/statov/portrait.jpg'] },
  twitter: { card: 'summary_large_image', title, description, images: ['/statov/portrait.jpg'] },
};

export default function StatovPage() {
  return <StatovPortfolio />;
}
