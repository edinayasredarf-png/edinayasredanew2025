// Файл: lib/config.ts

export const SITE_CONFIG = {
  url: 'https://xn--80aakbcct4b2aj7m.xn--p1ai/',
  name: 'Единая среда',

  contact: {
    phone: '+7-800-550-56-12',
    phoneRaw: '88005505612',
    email: 'info@единаясреда.рф',
  },

  social: {
    // Профили-сущности для sameAs (entity-склейка для поиска и ИИ).
    // ВАЖНО: только официальные и рабочие ссылки.
    vk: 'https://vk.com/edinayasredarf',
    telegram: 'https://t.me/edinayasredarf',
    rustore: 'https://www.rustore.ru/catalog/app/ru.edinayasreda',
    yandex: 'https://yandex.ru/maps/org/80012739748/',
  },

  analytics: {
    yandex: '89202191',
    google: 'G-6HGCDX1CZC', // ✅ ВАШ РЕАЛЬНЫЙ ID!
  },

  verification: {
    google: 'jTjeK9oAnjGz2u-MQGzIHkGk3bUuiujtRuOjvxKqNu0',
    yandex: 'ce00463607f5bc70',
  },
} as const