// Файл: sitemap.ts

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://xn--80aakbcct4b2aj7m.xn--p1ai/'

  return [
    {
      // Главная страница - самый высокий приоритет, обновляется часто (например, за счет новостей)
      url: baseUrl,
      lastModified: new Date(), // Оставляем new Date(), так как контент на главной может меняться
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      // Статичная страница, которая не меняется месяцами
      url: `${baseUrl}/about`,
      lastModified: '2025-10-29', // Установлена статичная дата. Замените на реальную дату последнего обновления.
      changeFrequency: 'monthly',
      priority: 0.8,
    },
		{
      // Важный раздел, который может обновляться, но не каждый день
      url: `${baseUrl}/blog`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      // Важный раздел, который может обновляться, но не каждый день
      url: `${baseUrl}/services`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/forest-management`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.8,
    },
		{
      url: `${baseUrl}/services/imz`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.8,
    },
		{
      url: `${baseUrl}/services/izn`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.8,
    },
		{
      url: `${baseUrl}/services/les`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/green-inventory`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/inventory-burials`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Раздел с кейсами/портфолио, обновляется периодически
      url: `${baseUrl}/cases`,
      lastModified: new Date(), // Оставляем new Date(), так как список кейсов может пополняться
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      // Динамический раздел, обновляется часто
      url: `${baseUrl}/blog`,
      lastModified: new Date(), // Оставляем new Date() для страницы списка постов
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      // Динамический раздел, обновляется часто
      url: `${baseUrl}/news`,
      lastModified: new Date(), // Оставляем new Date() для страницы списка новостей
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/partnership`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      // Контакты меняются крайне редко
      url: `${baseUrl}/contacts`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'yearly', // Изменено на "yearly" - это более корректно
      priority: 0.6,
    },
    {
      url: `${baseUrl}/documents`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      // Раздел с вакансиями, может обновляться
      url: `${baseUrl}/career`,
      lastModified: new Date(), // Оставляем new Date(), так как список вакансий может меняться
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/implementations`,
      lastModified: new Date(), // Оставляем new Date(), так как список может пополняться
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/welcome-bonus`,
      lastModified: '2025-10-29', // Установлена статичная дата
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
