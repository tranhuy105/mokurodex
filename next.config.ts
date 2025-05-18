import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/api/media/**",
      },
    ],
  },
  serverExternalPackages: ["sharp", "fs", "path"],
};

export default nextConfig;
