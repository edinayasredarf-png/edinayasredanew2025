import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    turbo: undefined,
  },
  // включаем шрифт письма в серверную функцию генерации PDF
  outputFileTracingIncludes: {
    '/api/letters/generate': ['./public/fonts/involve/**'],
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
