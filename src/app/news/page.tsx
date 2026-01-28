import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import NewsListClient from './NewsListClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Новости | Единая среда',
  description: 'Новости платформы «Единая среда». Обновления, анонсы и события.',
  alternates: { canonical: '/news' },
};

export default function NewsPage({ searchParams }: { searchParams?: { s?: string } }) {
  const slug = (searchParams?.s || '').trim();
  if (slug) {
    redirect(`/news/${encodeURIComponent(slug)}`);
  }
  return <NewsListClient />;
}
