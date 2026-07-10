// Файл: sitemap.ts

import { MetadataRoute } from 'next'
import { IZN_CITIES, IMZ_CITIES } from '@/lib/serviceCities'

// Без завершающего слэша — иначе `${baseUrl}/about` даёт двойной слэш `//about`.
const baseUrl = 'https://xn--80aakbcct4b2aj7m.xn--p1ai'

export default function sitemap(): MetadataRoute.Sitemap {
  // Статичная дата последнего обновления статических страниц.
  const staticDate = '2026-07-10'

  // ── Основные страницы ─────────────────────────────────────────────
  const core: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/about`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/services`, lastModified: staticDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/izn`, lastModified: staticDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/imz`, lastModified: staticDate, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/services/les`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/cases`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/implementations`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/pricing`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/partnership`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/career`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/documents`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/welcome-bonus`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/contacts`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.6 },
  ]

  // ── Городские страницы услуг (локальное SEO) ──────────────────────
  const iznCities: MetadataRoute.Sitemap = IZN_CITIES.map(({ slug }) => ({
    url: `${baseUrl}/services/izn/${slug}`,
    lastModified: staticDate,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const imzCities: MetadataRoute.Sitemap = IMZ_CITIES.map(({ slug }) => ({
    url: `${baseUrl}/services/imz/${slug}`,
    lastModified: staticDate,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...core, ...iznCities, ...imzCities]
}
