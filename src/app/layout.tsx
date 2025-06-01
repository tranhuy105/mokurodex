import { QueryClientProviderWrapper } from "@/components/provider/query-client-provider";
import MobileDebugOverlay from "@/components/pwa/MobileDebugOverlay";
import OnlineStatusOverlay from "@/components/pwa/OnlineStatusOverlay";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import NavbarWrapper from "@/components/ui/NavbarWrapper";
import Providers from "@/context/Providers";
import { ThemeProvider } from "next-themes";
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
                    <QueryClientProviderWrapper>
                        <Providers>
                            <NavbarWrapper />
                            <main>{children}</main>
                            {/* <PWAInstall /> */}
                            <Toaster position="bottom-right" />
                            <MobileDebugOverlay />
                            {/* <AnkiConnectDebugOverlay /> */}
                            <OnlineStatusOverlay />
                            <ServiceWorkerRegistration />
                            <UpdateNotification />
                        </Providers>
                    </QueryClientProviderWrapper>
                </ThemeProvider>
            </body>
        </html>
    );
}
