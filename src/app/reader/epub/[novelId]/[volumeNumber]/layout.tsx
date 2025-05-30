export default function EpubReaderLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {/* No navbar in reader mode */}
            <main className="w-full h-screen">
                {children}
            </main>
        </>
    );
}
