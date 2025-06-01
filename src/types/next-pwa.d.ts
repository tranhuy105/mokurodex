declare module "next-pwa" {
    import { NextConfig } from "next";

    interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        skipWaiting?: boolean;
        scope?: string;
        sw?: string;
        disableGeneratedSw?: boolean;
        buildExcludes?: RegExp[];
        mode?: "production" | "development";
        customWorkerDir?: string;
        runtimeCaching?: Array<{
            urlPattern: string | RegExp;
            handler: string;
            options?: {
                cacheName?: string;
                expiration?: {
                    maxEntries?: number;
                    maxAgeSeconds?: number;
                };
            };
        }>;
        additionalManifestEntries?: Array<{
            url: string;
            revision: string | null;
        }>;
    }

    export default function withPWA(
        config?: PWAConfig
    ): (nextConfig: NextConfig) => NextConfig;
}
