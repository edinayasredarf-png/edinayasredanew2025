import { MetadataRoute } from 'next'
import { getTimewebPool } from '@/lib/timewebPg'
import { IZN_CITY_SLUGS, IMZ_CITY_SLUGS, LES_CITY_SLUGS } from '@/lib/serviceCitySlugs'

// ISR: карта пересобирается не чаще раза в час (свежий контент из БД
// подхватывается автоматически), без запроса к БД на каждый заход робота.
export const revalidate = 3600

const baseUrl = 'https://xn--80aakbcct4b2aj7m.xn--p1ai'

const staticRoutes: MetadataRoute.Sitemap = [
  { url: `${baseUrl}/`,                      changeFrequency: 'daily',   priority: 1.0, lastModified: new Date() },
  { url: `${baseUrl}/about`,                 changeFrequency: 'monthly', priority: 0.9, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services`,              changeFrequency: 'weekly',  priority: 0.9, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/imz`,          changeFrequency: 'monthly', priority: 0.9, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/izn`,          changeFrequency: 'monthly', priority: 0.9, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/les`,          changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/green-inventory`,      changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/inventory-burials`,    changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-04-06' },
  { url: `${baseUrl}/services/inventory-burials-seo`, changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-04-06' },
  // Раздел «Решения» (информационные/GEO-страницы под ответы ИИ)
  { url: `${baseUrl}/resheniya`,                                    changeFrequency: 'weekly',  priority: 0.9, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/municipalnye-sistemy-ucheta`,        changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/blagoustroystvo`,                    changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/uchet-zelenyh-nasazhdeniy`,          changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/uchet-mest-zahoroneniy`,             changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/programma-dlya-inventarizacii`,      changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/sravnenie-sistem-inventarizacii`,    changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/preimushchestva`,                    changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/lesoustrojstvo`,                     changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/ocifrovka-territorij`,               changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/inventarizaciya-kladbishch`,         changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-20' },
  { url: `${baseUrl}/resheniya/luchshie-sistemy-inventarizacii`,    changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-21' },
  { url: `${baseUrl}/reviews`,                                      changeFrequency: 'weekly',  priority: 0.7, lastModified: '2026-07-21' },
  // Решения по отраслям (сегменты ЦА)
  { url: `${baseUrl}/dlya/zhk`,                                     changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-22' },
  { url: `${baseUrl}/dlya/sanatorii`,                               changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-22' },
  { url: `${baseUrl}/dlya/oteli`,                                   changeFrequency: 'monthly', priority: 0.8, lastModified: '2026-07-22' },
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

// createdat/updatedat в БД — bigint (epoch, мс), node-postgres отдаёт их строкой.
function epochToDate(value: unknown): Date {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? new Date(n) : new Date()
}

type ContentRow = { slug: string; createdat?: string | number; updatedat?: string | number }

async function getDynamicRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const pool = getTimewebPool()

    // В схеме (timeweb_public_schema.sql) колонки называются createdat/updatedat
    // и НЕТ поля published — весь сохранённый контент считается опубликованным.
    const [postsRes, newsRes, casesRes] = await Promise.all([
      pool.query<ContentRow>(
        `SELECT slug, createdat, updatedat FROM posts ORDER BY createdat DESC`
      ),
      pool.query<ContentRow>(
        `SELECT slug, createdat, updatedat FROM news ORDER BY createdat DESC`
      ),
      pool.query<ContentRow>(
        `SELECT slug, createdat, updatedat FROM cases ORDER BY createdat DESC`
      ),
    ])

    const posts: MetadataRoute.Sitemap = postsRes.rows.map(r => ({
      url: `${baseUrl}/blog/${r.slug}`,
      lastModified: epochToDate(r.updatedat ?? r.createdat),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    const newsItems: MetadataRoute.Sitemap = newsRes.rows.map(r => ({
      url: `${baseUrl}/news/${r.slug}`,
      lastModified: epochToDate(r.updatedat ?? r.createdat),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

    const cases: MetadataRoute.Sitemap = casesRes.rows.map(r => ({
      url: `${baseUrl}/cases/${r.slug}`,
      lastModified: epochToDate(r.updatedat ?? r.createdat),
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

    return [...posts, ...newsItems, ...cases]
  } catch (e) {
    console.error('sitemap: getDynamicRoutes failed', e)
    return []
  }
}

// ── Городские страницы услуг (локальное SEO) ────────────────────────
// Слаги берём из src/lib/serviceCitySlugs.ts (сгенерирован из реально
// существующих маршрутов /services/{izn,imz}/<slug>), чтобы в карту не
// попали 404. Дизайн и содержимое страниц не затрагиваются.
const cityRoutes: MetadataRoute.Sitemap = [
  ...IZN_CITY_SLUGS.map(slug => ({
    url: `${baseUrl}/services/izn/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: '2026-04-06',
  })),
  ...IMZ_CITY_SLUGS.map(slug => ({
    url: `${baseUrl}/services/imz/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: '2026-04-06',
  })),
  ...LES_CITY_SLUGS.map(slug => ({
    url: `${baseUrl}/services/les/${slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    lastModified: '2026-04-06',
  })),
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamic = await getDynamicRoutes()
  return [...staticRoutes, ...cityRoutes, ...dynamic]
}
