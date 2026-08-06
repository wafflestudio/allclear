/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  images: {
    domains: ['cdn.all-clear.cc', 'all-clear.cc'],
  },
  async headers() {
    return [
      {
        // iOS가 AASA 파일 검증 시 Content-Type: application/json 필수
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/download/app',
        permanent: true,
      },
    ]
  },
  rewrites: async () => {
    return [
      {
        source: '/c/@:clubname',
        destination: '/c/:clubname',
      },
    ]
  },
  output: 'standalone',
  webpack: (webpackConfig) => {
    return {
      ...webpackConfig,
      optimization: {
        minimize: false,
      },
    }
  },
}

module.exports = nextConfig
