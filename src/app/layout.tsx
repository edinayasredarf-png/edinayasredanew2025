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
  title: 'Единая среда — цифровая платформа для управления территориями',
  description: 'Единая среда — современная платформа для учёта, управления и мониторинга территорий и объектов. Всё для цифровизации и контроля.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Единая среда',
    title: 'Единая среда — цифровая платформа для управления территориями',
    description: 'Цифровизация учёта, управления и мониторинга территорий и объектов.',
    images: [
      { url: '/img/logo.png', width: 1200, height: 630, alt: 'Единая среда' },
    ],
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Единая среда — цифровая платформа для управления территориями',
    description: 'Цифровизация учёта, управления и мониторинга территорий и объектов.',
    images: ['/img/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
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
