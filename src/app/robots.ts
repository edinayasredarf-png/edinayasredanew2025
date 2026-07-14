// Файл: app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {


  const baseUrl = 'https://xn--80aakbcct4b2aj7m.xn--p1ai'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/blog/new',
          '/editor-demo',
          '/private/',
          '/*.json$',
          '/*?preview=',
          '/*?draft=',
        ],
      },
      { userAgent: 'Yandex', allow: '/', disallow: ['/admin', '/api/', '/blog/new', '/editor-demo'], crawlDelay: 2 },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/admin', '/api/', '/blog/new', '/editor-demo'] },
      // AI search crawlers — явно разрешены
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin', '/api/'] },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: ['/admin', '/api/'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin', '/api/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin', '/api/'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/admin', '/api/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
