import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const target = process.env.RAILWAY_API_BASE?.replace(/\/$/, '') || 'http://localhost:4000'
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`, // proxies /api/* → Railway/api/*
      },
    ]
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
