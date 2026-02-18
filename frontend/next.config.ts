import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const target = process.env.API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:4000'
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
