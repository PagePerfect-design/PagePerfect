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
  images: {
    unoptimized: false
  }
};

export default nextConfig;
