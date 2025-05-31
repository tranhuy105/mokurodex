declare module "next-pwa" {
    import { NextConfig } from "next";

    interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        skipWaiting?: boolean;
        scope?: string;
        sw?: string;
        runtimeCaching?: Array<{
            urlPattern: RegExp | string;
            handler: string;
            options?: {
                cacheName?: string;
                expiration?: {
                    maxEntries?: number;
                    maxAgeSeconds?: number;
                };
                networkTimeoutSeconds?: number;
                backgroundSync?: {
                    name: string;
                    options?: {
                        maxRetentionTime?: number;
                    };
                };
                cacheableResponse?: {
                    statuses: number[];
                    headers: {
                        [key: string]: string;
                    };
                };
                broadcastUpdate?: {
                    channelName: string;
                    options?: {
                        headersToCheck: string[];
                    };
                };
                plugins?: unknown[];
                fetchOptions?: {
                    mode?: string;
                    cache?: string;
                };
            };
        }>;
    }

    export default function withPWA(
        config?: PWAConfig
    ): (nextConfig: NextConfig) => NextConfig;
}
