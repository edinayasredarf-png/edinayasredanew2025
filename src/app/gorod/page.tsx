import type { Metadata } from 'next';
import CityCampaigns from './CityCampaigns';

export const metadata: Metadata = {
  title: 'Город рядом | Единая среда',
  description: 'Предложите идею для своего города или поддержите местный проект.',
  robots: { index: false, follow: false },
};

export default function CityPage() {
  return <CityCampaigns />;
}
