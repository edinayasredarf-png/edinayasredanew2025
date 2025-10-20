import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/blog/new', '/editor-demo'],
    },
    sitemap: 'https://edinayasreda.ru/sitemap.xml',
  }
}