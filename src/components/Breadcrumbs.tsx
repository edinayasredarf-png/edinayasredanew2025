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
  'inventory-burials': 'Инвентаризация мест захоронений',
  'green-inventory': 'Инвентаризация зелёных насаждений',
  'forest-management': 'Лесоустройство',
}

export default function Breadcrumbs({ items, customLabels }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Если переданы кастомные items, используем их
  if (items && items.length > 0) {
    return <BreadcrumbsDisplay items={items} pathname={pathname} />
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

  return <BreadcrumbsDisplay items={breadcrumbItems} pathname={pathname} />
}

// Компонент отображения
function BreadcrumbsDisplay({ items, pathname }: { items: BreadcrumbItem[], pathname: string }) {
  // JSON-LD для Schema.org
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://единаясреда.рф${item.href}`
    }))
  }

  return (
    <>
      {/* JSON-LD разметка для поисковиков */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Визуальные хлебные крошки */}
      <nav aria-label="Навигационная цепочка" className="breadcrumbs-wrapper">
        <div className="max-w-[1480px] mx-auto px-5 md:px-8 py-3">
          <ol
            className="flex flex-wrap items-center gap-2 text-sm"
            itemScope
            itemType="https://schema.org/BreadcrumbList"
          >
            {items.map((item, index) => {
              const isLast = index === items.length - 1

              return (
                <li
                  key={item.href}
                  itemProp="itemListElement"
                  itemScope
                  itemType="https://schema.org/ListItem"
                  className="flex items-center gap-2"
                >
                  {!isLast ? (
                    <>
                      <Link
                        href={item.href}
                        itemProp="item"
                        className="text-white/70 hover:text-white transition-colors text-sm font-normal"
                      >
                        <span itemProp="name">{item.label}</span>
                      </Link>
                      <meta itemProp="position" content={String(index + 1)} />
                      <svg
                        className="w-3.5 h-3.5 text-white/50"
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
                        itemProp="name"
                        className="text-white text-sm font-medium"
                      >
                        {item.label}
                      </span>
                      <meta itemProp="position" content={String(index + 1)} />
                      <link itemProp="item" href={`https://единаясреда.рф${item.href}`} />
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
