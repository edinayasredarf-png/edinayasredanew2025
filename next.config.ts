import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: undefined,
  },
  // включаем шрифт письма (Tinos, Times-совместимый) в серверную функцию генерации PDF
  outputFileTracingIncludes: {
    '/api/letters/generate': ['./public/fonts/tinos/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'i.pinimg.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.pinimg.com', pathname: '/**' },
      { protocol: 'https', hostname: 'media.единаясреда.рф', pathname: '/**' },
      { protocol: 'https', hostname: 'единаясреда.рф', pathname: '/**' },
      { protocol: 'https', hostname: '*.единаясреда.рф', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.yandexcloud.net', pathname: '/**' },
      { protocol: 'https', hostname: '*.storage.yandexcloud.net', pathname: '/**' },
      // Аватары OAuth: ВКонтакте и Яндекс
      { protocol: 'https', hostname: '*.userapi.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.vkuserphoto.ru', pathname: '/**' },
      { protocol: 'https', hostname: '*.vk.com', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.yandex.net', pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.mds.yandex.net', pathname: '/**' },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 дней
  },
  webpack: (config, { webpack }) => {
    config.resolve = config.resolve || {};
    // konva (движок редактора изображений Filerobot) тянет node-сборку с нативной
    // зависимостью `canvas`, которая на сервере не нужна — рисуем только в браузере.
    // Заглушаем её, иначе сборка падает с "Can't resolve 'canvas'".
    config.resolve.alias = { ...(config.resolve.alias || {}), canvas: false };
    // Собранные файлы Filerobot используют глобальный `React` без import — под
    // автоматическим JSX-рантаймом Next его нет. Подставляем React глобально,
    // иначе редактор падает с "ReferenceError: React is not defined".
    config.plugins = config.plugins || [];
    config.plugins.push(new webpack.ProvidePlugin({ React: 'react' }));
    return config;
  },
  async redirects() {
    return [
      { source: '/cases2', destination: '/cases', permanent: true },
      { source: '/cases2/:slug', destination: '/cases/:slug', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/img/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
