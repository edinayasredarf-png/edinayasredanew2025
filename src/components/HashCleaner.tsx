// components/HashCleaner.tsx

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function HashCleaner() {
  const pathname = usePathname()

  useEffect(() => {
    // Список нежелательных якорей
    const unwantedHashes = ['#f1', '#f2', '#f3']
    const currentHash = window.location.hash

    // Функция очистки
    const cleanHash = () => {
      const hash = window.location.hash
      if (unwantedHashes.includes(hash)) {
        // Убираем якорь без перезагрузки
        window.history.replaceState(null, '', pathname || '/')
        console.log('🧹 Очищен нежелательный якорь:', hash)
      }
    }

    // Очищаем при монтировании компонента
    cleanHash()

    // Следим за изменениями hash
    window.addEventListener('hashchange', cleanHash)

    // Следим за изменениями URL (для Next.js навигации)
    window.addEventListener('popstate', cleanHash)

    return () => {
      window.removeEventListener('hashchange', cleanHash)
      window.removeEventListener('popstate', cleanHash)
    }
  }, [pathname])

  return null
}
