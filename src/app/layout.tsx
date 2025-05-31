import { QueryClientProviderWrapper } from "@/components/provider/query-client-provider";
import { PWAInstall } from "@/components/pwa/PWAInstall";
import NavbarWrapper from "@/components/ui/NavbarWrapper";
import Providers from "@/context/Providers";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import "./globals.css";

// Remove direct import since we're using the component approach
// import "../lib/server-init";

export const metadata = {
    title: "MokuroDex",
    description:
        "Manga reader with Mokuro integration for language learning",
    icons: {
        icon: [
            { url: "/favicon.ico" },
            {
                url: "/favicon-16x16.png",
                sizes: "16x16",
                type: "image/png",
            },
            {
                url: "/favicon-32x32.png",
                sizes: "32x32",
                type: "image/png",
            },
        ],
        apple: { url: "/apple-touch-icon.png" },
        other: [
            {
                rel: "android-chrome-192x192",
                url: "/android-chrome-192x192.png",
            },
            {
                rel: "android-chrome-512x512",
                url: "/android-chrome-512x512.png",
            },
        ],
    },
    manifest: "/site.webmanifest",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="min-h-screen bg-background antialiased">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                >
                    <Providers>
                        <QueryClientProviderWrapper>
                            <NavbarWrapper />
                            <main>{children}</main>
                            <PWAInstall />
                            <Toaster position="bottom-right" />
                        </QueryClientProviderWrapper>
                    </Providers>
                </ThemeProvider>
                <Script
                    id="sw-register"
                    strategy="afterInteractive"
                >
                    {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js')
                .then(() => console.log('SW registered'))
                .catch(() => console.log('SW registration failed'));
            }
          `}
                </Script>
            </body>
        </html>
    );
}
