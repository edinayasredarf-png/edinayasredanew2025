// Файл: app/layout.tsx

import type { Metadata } from "next";
import { Inter, Raleway, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/involve-font.css";
import "@/styles/typography.css";
import "@/styles/page-hero.css";
import { ModalProvider } from "@/components/ModalProvider";
import { HashCleaner } from "@/components/HashCleaner";
import { TypographyNoWidows } from "@/components/TypographyNoWidows";

import Script from "next/script";
import { SITE_CONFIG } from "@/lib/config";
import { BitrixScript } from "./bitrix-script";

// ========================================
// ОПТИМИЗАЦИЯ ШРИФТОВ
// ========================================
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: true,
});

const raleway = Raleway({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});





// ========================================
// SEO МЕТАДАННЫЕ
// ========================================
export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),

  title: {
    default: 'Единая среда — цифровая платформа управления территориями',
    template: '%s | Единая среда',
  },

  description: 'Цифровое управление территориями для муниципалитетов. Учёт кладбищ, зелёных насаждений, торговых точек, ЛЭП, МАФов. Контроль подрядчиков и аналитика.',

  alternates: {
    canonical: '/',
  },

  openGraph: {
    type: 'website',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: 'Единая среда — цифровая платформа управления территориями',
    description: 'Цифровое управление территориями для муниципалитетов. Учёт объектов городской среды, контроль подрядчиков, аналитические дашборды.',
    images: [
      {
        url: `${SITE_CONFIG.url}/img/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Единая среда — цифровая платформа',
        type: 'image/jpeg',
      },
    ],
    locale: 'ru_RU',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Единая среда — цифровая платформа управления территориями',
    description: 'Цифровое управление территориями для муниципалитетов. Учёт объектов городской среды и аналитика.',
    images: [`${SITE_CONFIG.url}/img/og-image.jpg`],
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
    google: SITE_CONFIG.verification.google,
    yandex: SITE_CONFIG.verification.yandex,
  },

  other: {
    'application-name': SITE_CONFIG.name,
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
  },
};

// ========================================
// LAYOUT КОМПОНЕНТ
// ========================================
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const normalizedSiteUrl = SITE_CONFIG.url.endsWith('/')
    ? SITE_CONFIG.url.slice(0, -1)
    : SITE_CONFIG.url;

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* ========================================
            JSON-LD: Organization
            ======================================== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": SITE_CONFIG.name,
              "alternateName": ["Единая среда РФ", "ЕдинаяСреда.рф"],
              "url": normalizedSiteUrl,
              "logo": {
                "@type": "ImageObject",
                "url": `${normalizedSiteUrl}/img/logo.png`,
                "width": "200",
                "height": "60"
              },
              "image": `${normalizedSiteUrl}/img/og-image.jpg`,
              "description": "Цифровое управление территориями для муниципалитетов и городских служб. Учёт объектов городской среды, контроль подрядчиков, аналитика.",
              "foundingDate": "2026",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "RU"
              },
              "contactPoint": [
                {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "telephone": SITE_CONFIG.contact.phone,
                  "email": SITE_CONFIG.contact.email,
                  "url": `${normalizedSiteUrl}/contacts`,
                  "availableLanguage": ["Russian"],
                  "areaServed": "RU"
                }
              ],
              "sameAs": Object.values(SITE_CONFIG.social).filter(Boolean)
            })
          }}
        />

        {/* ========================================
            JSON-LD: WebSite
            ======================================== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": SITE_CONFIG.name,
              "url": normalizedSiteUrl,
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${normalizedSiteUrl}/search?q={search_term_string}`
                }
              }
            })
          }}
        />

        {/* ========================================
            ЯНДЕКС.МЕТРИКА
            ======================================== */}
        <Script
          id="yandex-metrika"
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

              ym(${SITE_CONFIG.analytics.yandex}, 'init', {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true,
                ecommerce:"dataLayer"
              });
            `,
          }}
        />

        {/* ========================================
            B242YA (передача Yandex ClientId в Bitrix24)
            ======================================== */}
        <Script
          id="b242ya"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,u){
                var s=d.createElement('script');s.defer=false;s.async=false;s.id='b242ya-script';s.src=u+'?'+(Date.now()/60000|0);
                var h=d.getElementsByTagName('script')[0];h.parentNode.insertBefore(s,h);
              })(window,document,'https://67p.b242ya.ru/static/js/b242ya.js');
              var b242yaScript = document.querySelector('#b242ya-script');
              b242yaScript.addEventListener('load', function() {
                B242YAInit({
                  portal:'https://oooecostroy.bitrix24.ru/',
                  pid:'6d58ab7105a24788c2a432f25d252c52'
									presets: {YA_COUNTER:"89202191"}
                });
              });
            `,
          }}
        />


{/* ========================================
    VK / MAIL.RU PIXEL
    ======================================== */}
<Script
  id="vk-mailru-counter"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      var _tmr = window._tmr || (window._tmr = []);
      _tmr.push({
        id: "3767579",
        type: "pageView",
        start: (new Date()).getTime()
      });

      (function (d, w, id) {
        if (d.getElementById(id)) return;

        var ts = d.createElement("script");
        ts.type = "text/javascript";
        ts.async = true;
        ts.id = id;
        ts.src = "https://top-fwz1.mail.ru/js/code.js";

        var f = function () {
          var s = d.getElementsByTagName("script")[0];
          s.parentNode.insertBefore(ts, s);
        };

        if (w.opera == "[object Opera]") {
          d.addEventListener("DOMContentLoaded", f, false);
        } else {
          f();
        }
      })(document, window, "tmr-code");
    `,
  }}
/>

        {/* ========================================
            GOOGLE ANALYTICS (GA4)
            ✅ Ваш ID: G-6HGCDX1CZC
            ======================================== */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${SITE_CONFIG.analytics.google}`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${SITE_CONFIG.analytics.google}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>

      <body
        className={`${inter.variable} ${raleway.variable} ${geistMono.variable} antialiased redesign`}
      >
        {/* Яндекс.Метрика noscript */}
        <noscript>
          <div>
            <img
              src={`https://mc.yandex.ru/watch/${SITE_CONFIG.analytics.yandex}`}
              style={{ position: 'absolute', left: '-9999px' }}
              alt=""
            />
          </div>
        </noscript>
				{/* VK / MAIL.RU noscript */}
<noscript>
  <div>
    <img
      src="https://top-fwz1.mail.ru/counter?id=3767579;js=na"
      style={{ position: 'absolute', left: '-9999px' }}
      alt="Top.Mail.Ru"
    />
  </div>
</noscript>
				<HashCleaner />
        <TypographyNoWidows />
        <ModalProvider>
          {children}
        </ModalProvider>
			{/* ========================================
    BITRIX24 CALL TRACKER
    ======================================== */}
<BitrixScript />
      </body>
    </html>
  );
}
