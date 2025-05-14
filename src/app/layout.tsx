import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import Providers from "@/context/Providers";
import ServerInitializer from "@/components/ServerInitializer";
import Navbar from "@/components/ui/Navbar";

// Remove direct import since we're using the component approach
// import "../lib/server-init";

export const metadata = {
  title: "MokuReader",
  description: "Manga reader with Mokuro integration for language learning",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png" },
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="no-scrollbar">
      <body className="antialiased bg-gray-100 dark:bg-gray-900 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            {/* This component triggers server initialization */}
            <ServerInitializer />
            <Navbar />
            <main>{children}</main>
            <Toaster position="bottom-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
