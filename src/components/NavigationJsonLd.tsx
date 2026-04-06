// components/NavigationJsonLd.tsx
'use client';

import { SITE_CONFIG } from '@/lib/config';

export function NavigationJsonLd() {
  const navigation = {
    '@context': 'https://schema.org',
    '@type': 'SiteNavigationElement',
    'name': 'Главное меню',
    'url': SITE_CONFIG.url,
    'hasPart': [
      {
        '@type': 'SiteNavigationElement',
        'name': 'Кейсы',
        'url': `${SITE_CONFIG.url}/cases/`
      },
      {
        '@type': 'SiteNavigationElement',
        'name': 'Платформа',
        'url': `${SITE_CONFIG.url}/platform`,
        'hasPart': [
          {
            '@type': 'SiteNavigationElement',
            'name': 'Войти в ЛК',
            'url': 'https://edinayasreda.ru/'
          },
          {
            '@type': 'SiteNavigationElement',
            'name': 'Мобильное приложение',
            'url': 'https://www.rustore.ru/catalog/app/ru.edinayasreda'
          }
        ]
      },
      {
        '@type': 'SiteNavigationElement',
        'name': 'Услуги',
        'url': `${SITE_CONFIG.url}/services`,
        'hasPart': [
          {
            '@type': 'SiteNavigationElement',
            'name': 'Инвентаризация мест захоронений',
            'url': `${SITE_CONFIG.url}/services/imz`
          },
          {
            '@type': 'SiteNavigationElement',
            'name': 'Инвентаризация зелёных насаждений',
            'url': `${SITE_CONFIG.url}/services/izn`
          },
          {
            '@type': 'SiteNavigationElement',
            'name': 'Лесоустройство',
            'url': `${SITE_CONFIG.url}/services/les`
          }
        ]
      },
      {
        '@type': 'SiteNavigationElement',
        'name': 'Компания',
        'url': `${SITE_CONFIG.url}/about`,
        'hasPart': [
          {
            '@type': 'SiteNavigationElement',
            'name': 'О компании',
            'url': `${SITE_CONFIG.url}/about`
          },
          {
            '@type': 'SiteNavigationElement',
            'name': 'Карьера',
            'url': `${SITE_CONFIG.url}/career`
          }
        ]
      },
      {
        '@type': 'SiteNavigationElement',
        'name': 'Цены',
        'url': `${SITE_CONFIG.url}/pricing`
      },
      {
        '@type': 'SiteNavigationElement',
        'name': 'Блог',
        'url': `${SITE_CONFIG.url}/blog`
      },
      {
        '@type': 'SiteNavigationElement',
        'name': 'Контакты',
        'url': `${SITE_CONFIG.url}/contacts`
      },
      {
        '@type': 'SiteNavigationElement',
        'name': 'Партнёрство',
        'url': `${SITE_CONFIG.url}/partnership`
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(navigation) }}
    />
  );
}