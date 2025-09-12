import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://edinayasreda.ru';
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contacts`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/cases`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/services/inventory-burials`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/services/green-inventory`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/services/forest-management`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];

  return urls;
}


