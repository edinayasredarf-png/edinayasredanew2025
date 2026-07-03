import { MetadataRoute } from 'next'
import { getTimewebPool } from '@/lib/timewebPg'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const baseUrl = 'https://единаясреда.рф'

const staticRoutes: MetadataRoute.Sitemap = [
  { url: `${baseUrl}/`,                      changeFrequency: 'daily',   priority: 1.0, lastModified: new Date() },
  { url: `${baseUrl}/about`,                 changeFrequency: 'monthly', priority: 0.9, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services`,              changeFrequency: 'weekly',  priority: 0.9, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/imz`,          changeFrequency: 'monthly', priority: 0.9, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/izn`,          changeFrequency: 'monthly', priority: 0.9, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/les`,          changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-04-06' },
  { url: `${baseUrl}/blog`,                  changeFrequency: 'weekly',  priority: 0.9, lastModified: new Date() },
  { url: `${baseUrl}/cases`,                 changeFrequency: 'weekly',  priority: 0.8, lastModified: new Date() },
  { url: `${baseUrl}/news`,                  changeFrequency: 'daily',   priority: 0.7, lastModified: new Date() },
  { url: `${baseUrl}/pricing`,               changeFrequency: 'monthly', priority: 0.7, lastModified: '2026-04-06' },
  { url: `${baseUrl}/partnership`,           changeFrequency: 'monthly', priority: 0.6, lastModified: '2026-04-06' },
  { url: `${baseUrl}/contacts`,              changeFrequency: 'yearly',  priority: 0.6, lastModified: '2026-04-06' },
  { url: `${baseUrl}/career`,                changeFrequency: 'weekly',  priority: 0.5, lastModified: new Date() },
  { url: `${baseUrl}/documents`,             changeFrequency: 'monthly', priority: 0.5, lastModified: '2026-04-06' },
  { url: `${baseUrl}/requisites`,            changeFrequency: 'yearly',  priority: 0.4, lastModified: '2026-07-03' },
  { url: `${baseUrl}/implementations`,       changeFrequency: 'monthly', priority: 0.6, lastModified: new Date() },
  { url: `${baseUrl}/welcome-bonus`,         changeFrequency: 'monthly', priority: 0.5, lastModified: '2026-04-06' },
]

async function getDynamicRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const pool = getTimewebPool()

    const [postsRes, newsRes, casesRes] = await Promise.all([
      pool.query<{ slug: string; updated_at?: string; created_at?: string }>(
        `SELECT slug, updated_at, created_at FROM posts WHERE published = true ORDER BY created_at DESC`
      ),
      pool.query<{ slug: string; updated_at?: string; created_at?: string }>(
        `SELECT slug, updated_at, created_at FROM news ORDER BY created_at DESC`
      ),
      pool.query<{ slug: string; updated_at?: string; created_at?: string }>(
        `SELECT slug, updated_at, created_at FROM cases ORDER BY created_at DESC`
      ),
    ])

    const posts: MetadataRoute.Sitemap = postsRes.rows.map(r => ({
      url: `${baseUrl}/blog/${r.slug}`,
      lastModified: r.updated_at ?? r.created_at ?? new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    const newsItems: MetadataRoute.Sitemap = newsRes.rows.map(r => ({
      url: `${baseUrl}/news/${r.slug}`,
      lastModified: r.updated_at ?? r.created_at ?? new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    const cases: MetadataRoute.Sitemap = casesRes.rows.map(r => ({
      url: `${baseUrl}/cases/${r.slug}`,
      lastModified: r.updated_at ?? r.created_at ?? new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    return [...posts, ...newsItems, ...cases]
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamic = await getDynamicRoutes()
  return [...staticRoutes, ...dynamic]
}
