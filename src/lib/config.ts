// Файл: lib/config.ts

export const SITE_CONFIG = {
  url: 'https://единаясреда.рф',
  name: 'Единая среда',

  contact: {
    phone: '+7-800-550-56-12',
    phoneRaw: '88005505612',
    email: 'info@единаясреда.рф',
  },

  social: {
    // Добавьте ссылки на соцсети, если есть:
    vk: 'https://vk.com/edinayasredarf',
   telegram: 'https://t.me/@edinayasredarf',
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