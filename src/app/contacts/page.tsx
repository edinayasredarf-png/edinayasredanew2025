import { Metadata } from 'next';
import ContactsPageClient from './ContactsPageClient';

export const metadata: Metadata = {
  title: 'Контакты — Единая среда',
  description: 'Свяжитесь с нами: +7 (800) 550-56-12, info@единаясреда.рф. Консультации по инвентаризации территорий, внедрению платформы и государственным контрактам. Пн-Пт 9:00–18:00.',
  alternates: { canonical: '/contacts' },
  openGraph: {
    title: 'Контакты — Единая среда',
    description: 'Телефон: +7 (800) 550-56-12. Email: info@единаясреда.рф. Консультации по цифровому управлению территориями.',
    url: 'https://единаясреда.рф/contacts',
  },
};

export default function ContactsPage() {
  return <ContactsPageClient />;
}
