/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Игнорируем ошибки ESLint во время prod-сборки
    ignoreDuringBuilds: true,
  },
  images: {
    // Disable image optimization to work on static hosts
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net', pathname: '/**' },
      // { protocol: 'https', hostname: 'raw.githubusercontent.com', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
