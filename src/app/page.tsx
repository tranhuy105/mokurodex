import { Book, FileText, LayoutGrid } from "lucide-react";
// import { getAllManga } from "@/actions/manga-actions";
import { PageHeader } from "@/components/ui/PageHeader";
// import { EmptyState } from "@/components/ui/EmptyState";
// import { MangaGrid } from "@/components/manga/MangaGrid";
import { Suspense } from "react";
import Link from "next/link";
// import { MangaCard } from "@/components/manga/MangaCard";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { getAllMangaWithUserData } from "@/actions/manga-management-prisma";
import { ContinueReading } from "@/components/manga/ContinueReading";


async function HomeStats() {
  const mangaList = await getAllMangaWithUserData();
  const totalManga = mangaList.length;
  const totalVolumes = mangaList.reduce(
    (count, manga) => count + manga.volumes,
    0
  );
  const totalPages = mangaList.reduce(
    (count, manga) => count + manga.volumes * 50,
    0
  ); // Estimate average 50 pages per volume

  // Get most recently added manga (up to 3)
  const recentManga = [...mangaList]
    .sort((a, b) => {
      if (a.lastModified && b.lastModified) {
        return (
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
        );
      }
      return 0;
    })
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5">
          <div className="flex items-start">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Book className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Manga
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {totalManga}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5">
          <div className="flex items-start">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <LayoutGrid className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Volumes
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {totalVolumes}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-5">
          <div className="flex items-start">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Pages
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {totalPages.toLocaleString()}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Reading section */}
      <Suspense
        fallback={
          <div className="h-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl"></div>
        }
      >
        <ContinueReading limit={3} showHeader={true} />
      </Suspense>

      {/* Recently added section */}
      {recentManga.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recently Added
            </h2>
            <Link
              href="/manga"
              className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
            >
              View all
            </Link>
          </div>

          <MangaGrid
            mangaList={recentManga}
            InitialViewMode="list"
            showFilters={false}
          />
        </div>
      )}

      {/* CTA for all manga */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-5 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 md:space-y-1 mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-white">
              View Your Entire Collection
            </h2>
            <p className="text-orange-100">
              Browse and read your entire manga library
            </p>
          </div>
          <Link
            href="/manga"
            className="inline-flex justify-center items-center px-5 py-2.5 rounded-lg bg-white text-orange-600 font-medium hover:bg-orange-50 shadow-sm transition-colors"
          >
            Browse Library
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <PageHeader
        title="Welcome to MokuroDex"
        subtitle="Your digital manga reading application"
        className="mb-8"
      />

      <Suspense fallback={<p>Loading stats...</p>}>
        <HomeStats />
      </Suspense>
    </div>
  );
}
