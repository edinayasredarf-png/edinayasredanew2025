// components/Breadcrumbs.tsx

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  customLabels?: Record<string, string>
}

const DEFAULT_SITE_URL = 'https://единаясреда.рф'

const resolveSiteUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return DEFAULT_SITE_URL
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

// Маппинг URL → человекопонятные названия
const DEFAULT_LABELS: Record<string, string> = {
  '': 'Главная',
  'about': 'О компании',
  'cases': 'Кейсы',
  'pricing': 'Цены',
  'documents': 'Документация',
  'career': 'Карьера',
  'contacts': 'Контакты',
  'services': 'Услуги',
  'news': 'Новости',
  'blog': 'Блог',
  'post': 'Публикации',
  'n': 'Новости',
  'b': 'Блог',
  'imz': 'Инвентаризация мест захоронений',
  'izn': 'Инвентаризация зеленых насаждений',
  'les': 'Лесоустройство',
  'auth': 'Авторизация',
  'callback': 'Callback',
  'test-auth': 'Тест авторизации',
  'inventory-burials': 'Инвентаризация мест захоронений',
  'inventory-burials-landing': 'Инвентаризация мест захоронений',
  'inventory-burials-seo': 'Инвентаризация мест захоронений',
  'green-inventory': 'Инвентаризация зелёных насаждений',
  'forest-management': 'Лесоустройство',
  'partnership': 'Партнёрство',
  'implementations': 'Внедрения',
  'course': 'Обучающий курс',
  'demo': 'Демонстрация',
  'welcome-bonus': 'Добро пожаловать',
  'profile': 'Личный кабинет',
  'admin': 'Администрирование',
}

// Сокращённые названия для мобильных
const MOBILE_LABELS: Record<string, string> = {
  'inventory-burials': 'Инвентаризация кладбищ',
  'green-inventory': 'Учёт насаждений',
  'forest-management': 'Лесоустройство',
}

export default function Breadcrumbs({ items, customLabels }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Если переданы кастомные items, используем их
  if (items && items.length > 0) {
    return <BreadcrumbsDisplay items={items} />
  }

  // Автоматическая генерация из URL
  const segments = pathname.split('/').filter(Boolean)

  // Главная страница — не показываем breadcrumbs
  if (segments.length === 0) {
    return null
  }

  const labels = { ...DEFAULT_LABELS, ...customLabels }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Главная', href: '/' }
  ]

  let currentPath = ''
  segments.forEach((segment) => {
    currentPath += `/${segment}`
    breadcrumbItems.push({
      label: labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: currentPath,
    })
  })

  return <BreadcrumbsDisplay items={breadcrumbItems} />
}

// Компонент отображения
function BreadcrumbsDisplay({ items }: { items: BreadcrumbItem[] }) {
  const siteUrl = resolveSiteUrl()

  // JSON-LD для Schema.org
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `${siteUrl}${item.href}`
    }))
  }

  // Функция для получения сокращённого названия
  const getMobileLabel = (label: string, href: string): string => {
    const segment = href.split('/').pop() || ''
    return MOBILE_LABELS[segment] || label
  }

  return (
    <>
      {/* JSON-LD разметка для поисковиков */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Визуальные хлебные крошки */}
      <nav aria-label="Навигационная цепочка" className="breadcrumbs-wrapper font-[Raleway] bg-[#F6F7F9]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 font-medium">
          <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
            {items.map((item, index) => {
              const isLast = index === items.length - 1
              const isFirst = index === 0

              return (
                <li
                  key={item.href}
                  className="flex items-center gap-1.5 sm:gap-2"
                >
                  {!isLast ? (
                    <>
                      <Link
                        href={item.href}
                        className="text-[#667085] hover:text-[#313131] transition-colors text-xs sm:text-sm font-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px] sm:max-w-[150px] md:max-w-none"
                        title={item.label}
                      >
                        {/* Десктоп: полное название */}
                        <span className="hidden md:inline">
                          {item.label}
                        </span>
                        {/* Мобильные: сокращённое название или иконка для "Главная" */}
                        <span className="md:hidden">
                          {isFirst ? (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          ) : (
                            getMobileLabel(item.label, item.href)
                          )}
                        </span>
                      </Link>
                      <svg
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D0D5DD] flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span
                        className="text-[#313131] text-xs sm:text-sm font-medium max-w-[150px] sm:max-w-[200px] md:max-w-none whitespace-nowrap overflow-hidden text-ellipsis"
                        title={item.label}
                      >
                        {/* Десктоп: полное название */}
                        <span className="hidden md:inline">{item.label}</span>
                        {/* Мобильные: сокращённое название */}
                        <span className="md:hidden">{getMobileLabel(item.label, item.href)}</span>
                      </span>
                    </>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </nav>
    </>
  )
}
