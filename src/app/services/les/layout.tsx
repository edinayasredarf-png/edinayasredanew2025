import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Лесоустройство — Единая среда',
  description: 'Комплекс работ по лесоустройству: таксация, проектирование, карты и документация. Работа по требованиям законодательства.',
  alternates: { canonical: '/services/les' },
  openGraph: {
    title: 'Лесоустройство — Единая среда',
    description: 'Таксация, документация и карты — полный комплекс лесоустройства.',
    url: '/services/les',
    type: 'article',
    images: [{ url: '/img/лес.png', width: 1200, height: 630, alt: 'Лесоустройство' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Лесоустройство — Единая среда',
    description: 'Профессиональные работы по лесоустройству.',
    images: ['/img/лес.png'],
  },
};

export default function ServicesForestManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

      {/* JSON-LD — SoftwareApplication */}
      <Script id="json-ld-software" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "АИС «Единая среда»",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/services/les",
          screenshot: "https://xn--80aakbcct4b2aj7m.xn--p1ai/img/лес.png",
          description: "Лесоустройство: таксация, дешифрирование, картографирование и подготовка лесоустроительной документации с оцифровкой материалов и созданием цифровых лесных карт.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "RUB",
            url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/services/les"
          },
          featureList: [
            "Таксация лесных насаждений",
            "Цифровые лесные карты",
            "Лесоустроительная документация",
            "Оцифровка материалов лесоустройства"
          ]
        })}
      </Script>
      {/* FAQPage JSON-LD генерируется компонентом FAQ внутри LesFAQSection — здесь не дублируем */}
    </>
  );
}


