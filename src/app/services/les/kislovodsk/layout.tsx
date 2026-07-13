import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Лесоустройство в Кисловодске под ключ — комплексные работы',
  description: 'Профессиональное лесоустройство в Кисловодске: инвентаризация лесного фонда, таксация, разработка проектов. Соответствие требованиям законодательства.',
  alternates: { canonical: '/services/les/kislovodsk' },
  openGraph: {
    title: 'Лесоустройство в Кисловодске — Единая среда',
    description: 'Комплексное лесоустройство в Кисловодске: оценка состояния лесов, картографирование, планирование лесохозяйственных мероприятий.',
    url: '/services/les/kislovodsk',
    type: 'article',
    images: [{ url: '/img/les.png', width: 1200, height: 630, alt: 'Лесоустройство' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Лесоустройство в Кисловодске — Единая среда',
    description: 'Профессиональное лесоустройство в Кисловодске: точные данные и аналитика.',
    images: ['/img/les.png'],
  },
};

export default function LesoustrojstvoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script id="json-ld-software" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Лесоустройство",
          serviceType: "Лесоустройство",
          provider: { "@type": "Organization", name: "Единая среда", url: "https://xn--80aakbcct4b2aj7m.xn--p1ai" },
          areaServed: { "@type": "City", name: "Кисловодск" },
          url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/services/les/kislovodsk",
          description: "Лесоустройство в Кисловодске: инвентаризация лесного фонда, таксация, разработка проектов.",
        })}
      </Script>
      <Script id="json-ld-faq" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Какой срок исполнения работ?", acceptedAnswer: { "@type": "Answer", text: "Выполнение комплекса работ занимает от 20 рабочих дней (календарный месяц) до 2х лет" } },
            { "@type": "Question", name: "Как часто проводится лесоустройство?", acceptedAnswer: { "@type": "Answer", text: "Лесоустроительные работы могут проводиться через каждые 10, 15 или 20 лет в зависимости от интенсивности ведения лесного хозяйства." } },
            { "@type": "Question", name: "Что получает заказчик по итогам работ?", acceptedAnswer: { "@type": "Answer", text: "Полный комплект лесоустроительной документации, цифровые карты и планы лесных участков." } },
          ]
        })}
      </Script>
    </>
  );
}
