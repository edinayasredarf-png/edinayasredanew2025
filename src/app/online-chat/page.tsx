import { Metadata } from 'next';
import OnlineChatPageClient from './OnlineChatPageClient';

export const metadata: Metadata = {
  title: 'Онлайн-чат — Единая среда',
  description: 'Задайте вопрос в онлайн-чате «Единой среды». Оператор ответит в течение нескольких минут — консультации по системе, услугам и внедрению.',
  alternates: { canonical: '/online-chat' },
  robots: { index: false, follow: true },
  openGraph: {
    title: 'Онлайн-чат — Единая среда',
    description: 'Задайте вопрос в онлайн-чате «Единой среды». Оператор ответит в течение нескольких минут.',
    url: 'https://xn--80aakbcct4b2aj7m.xn--p1ai/online-chat',
  },
};

export default function OnlineChatPage() {
  return <OnlineChatPageClient />;
}
