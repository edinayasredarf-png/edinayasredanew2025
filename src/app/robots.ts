// Файл: app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {


  const baseUrl = 'https://xn--80aakbcct4b2aj7m.xn--p1ai/'



  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',           // Админ-панель
          '/admin/',          // С слешем на конце (на всякий случай)
          '/api/',            // API endpoints
          '/blog/new',        // Форма создания поста
          '/editor-demo',     // Демо-редактор
          '/_next/',          // Служебные файлы Next.js
          '/private/',        // Если есть приватные разделы
          '/*.json$',         // JSON файлы
          '/*?preview=',      // Параметры предпросмотра
          '/*?draft=',        // Черновики
        ],
      },
      // Опционально: специальные правила для Яндекса
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/admin', '/api/', '/blog/new', '/editor-demo', '/_next/'],
        crawlDelay: 2, // Задержка между запросами (секунды)
      },
      // Опционально: для Google
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api/', '/blog/new', '/editor-demo'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
