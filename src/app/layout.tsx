import type { Metadata } from "next";
import { Raleway, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/components/ModalProvider";
import Script from "next/script";

const raleway = Raleway({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://edinayasreda.ru'),
  title: 'Единая среда — цифровая платформа для управления территориями | ЕдинаяСреда.рф | Единая среда РФ',
  description: 'Единая среда РФ — современная цифровая платформа для учёта, управления и мониторинга территорий и объектов. ЕдинаяСреда.рф — цифровизация территорий, управление лесами, инвентаризация объектов, ГИС-платформа.',
  keywords: [
    'единая среда',
    'единая среда рф', 
    'единаясреда.рф',
    'единая среда платформа',
    'единая среда цифровая',
    'единая среда управление территориями',
    'цифровая платформа',
    'управление территориями',
    'цифровизация территорий',
    'управление лесами',
    'инвентаризация объектов',
    'мониторинг территорий',
    'учёт территорий',
    'цифровые технологии',
    'ГИС платформа',
    'ГИС система',
    'территориальное планирование',
    'цифровизация лесов',
    'лесное хозяйство',
    'природные ресурсы',
    'экологический мониторинг',
    'земельный кадастр',
    'территориальная информация'
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Единая среда',
    title: 'Единая среда — цифровая платформа для управления территориями | ЕдинаяСреда.рф',
    description: 'Единая среда РФ — современная цифровая платформа для учёта, управления и мониторинга территорий и объектов. Цифровизация территорий, управление лесами, инвентаризация объектов.',
    images: [
      { url: '/img/logo.png', width: 1200, height: 630, alt: 'Единая среда' },
    ],
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Единая среда — цифровая платформа для управления территориями | ЕдинаяСреда.рф',
    description: 'Единая среда РФ — современная цифровая платформа для учёта, управления и мониторинга территорий и объектов.',
    images: ['/img/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    yandex: 'ce00463607f5bc70',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="yandex-verification" content="ce00463607f5bc70" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Единая среда",
              "alternateName": ["Единая среда РФ", "ЕдинаяСреда.рф", "Единая среда платформа"],
              "url": "https://edinayasreda.ru",
              "logo": "https://edinayasreda.ru/img/logo.png",
              "description": "Единая среда РФ — современная цифровая платформа для учёта, управления и мониторинга территорий и объектов. Цифровизация территорий, управление лесами, инвентаризация объектов.",
              "foundingDate": "2024",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "RU"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "url": "https://edinayasreda.ru/contacts"
              },
              "sameAs": [
                "https://edinayasreda.ru"
              ],
              "offers": {
                "@type": "Offer",
                "name": "Единая среда — цифровая платформа для управления территориями",
                "description": "Современные решения для учёта, управления и мониторинга территорий и объектов. Цифровизация лесов, инвентаризация объектов, ГИС-платформа."
              },
              "knowsAbout": [
                "цифровизация территорий",
                "управление лесами", 
                "инвентаризация объектов",
                "мониторинг территорий",
                "ГИС платформа",
                "территориальное планирование",
                "лесное хозяйство",
                "природные ресурсы"
              ]
            })
          }}
        />
        <Script
          id="ym-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {
                  if (document.scripts[j].src === r) { return; }
                }
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document,'script','https://mc.yandex.ru/metrika/tag.js', 'ym');

              ym(89202191, 'init', {webvisor:true, clickmap:true, accurateTrackBounce:true, trackLinks:true});
            `,
          }}
        />
      </head>
      <body
        className={`${raleway.variable} ${geistMono.variable} antialiased`}
      >
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/89202191" style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
        <ModalProvider>
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}
