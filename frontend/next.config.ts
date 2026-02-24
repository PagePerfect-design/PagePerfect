import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const target = (process.env.API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/(favicon\\.ico|favicon\\.svg|favicon-.*\\.png|apple-touch-icon\\.png|android-chrome-.*\\.png)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
        ],
      },
    ]
  },
  images: {
    unoptimized: false
  }
};

export default nextConfig;
