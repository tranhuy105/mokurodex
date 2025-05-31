import { ContinueReading } from "@/components/home/ContinueReading";
import { HomeStats } from "@/components/home/HomeStats";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";

export default function HomePage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <PageHeader
                title="Welcome to MokuroDex"
                subtitle="Your digital manga reading application"
                className="mb-8"
            />

            <div className="space-y-10">
                {/* Continue Reading section */}
                <ContinueReading
                    limit={3}
                    showHeader={true}
                />

                {/* Stats section */}
                <HomeStats />

                {/* CTA for all manga */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl shadow-lg overflow-hidden">
                    <div className="px-6 py-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2 md:space-y-1 mb-4 md:mb-0">
                            <h2 className="text-2xl font-bold text-white">
                                View Your Entire Collection
                            </h2>
                            <p className="text-orange-100 text-lg">
                                Browse and read your entire
                                manga library
                            </p>
                        </div>
                        <Link
                            href="/content"
                            className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-white text-orange-600 font-medium hover:bg-orange-50 shadow-sm transition-colors text-lg"
                        >
                            Browse Library
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
