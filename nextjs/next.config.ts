import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Configure external images (S3, etc.)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },

  // Transpile Ant Design for SSR
  transpilePackages: ['antd', '@ant-design/icons'],
};

export default nextConfig;
