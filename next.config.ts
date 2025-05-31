import type { NextConfig } from 'next';
import withPWA from "next-pwa";

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

// Configure PWA
const pwaConfig = withPWA({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern:
                /^https:\/\/fonts\.(?:gstatic|googleapis)\.com/,
            handler: "CacheFirst",
            options: {
                cacheName: "google-fonts",
                expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
            },
        },
        {
            urlPattern: /\/api\/media/,
            handler: "CacheFirst",
            options: {
                cacheName: "manga-images",
                expiration: {
                    maxEntries: 500,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },
        {
            urlPattern: /\/api\/epub/,
            handler: "CacheFirst",
            options: {
                cacheName: "epub-files",
                expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },
        {
            urlPattern: /\/_next\/image\?url/,
            handler: "CacheFirst",
            options: {
                cacheName: "next-images",
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
            },
        },
        {
            urlPattern: /\/_next\/static\/.*/,
            handler: "CacheFirst",
            options: {
                cacheName: "static-assets",
                expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
            },
        },
    ],
});

export default pwaConfig(nextConfig);
