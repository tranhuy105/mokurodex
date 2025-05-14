import { Book, Clock } from "lucide-react";
// import { getAllManga } from "@/actions/manga-actions";
import { PageHeader } from "@/components/ui/PageHeader";
// import { EmptyState } from "@/components/ui/EmptyState";
// import { MangaGrid } from "@/components/manga/MangaGrid";
import { Suspense } from "react";
import Link from "next/link";
// import { MangaCard } from "@/components/manga/MangaCard";
import { fetchAllManga } from "@/actions/manga-api";
import Image from "next/image";
import { FileText, LayoutGrid } from "lucide-react";

// Format date helper function
function formatDate(dateString?: string): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// Main content component
// async function MangaContent() {
//   try {
//     const mangaList = await getAllManga();

//     if (mangaList.length === 0) {
//       return (
//         <EmptyState
//           icon={Book}
//           title="No manga found"
//           message="Your library is empty. Add some manga to get started."
//           variant="default"
//         />
//       );
//     }

//     // Get recent manga (last 6)
//     const recentManga = [...mangaList]
//       .sort((a, b) => {
//         if (a.lastModified && b.lastModified) {
//           return (
//             new Date(b.lastModified).getTime() -
//             new Date(a.lastModified).getTime()
//           );
//         }
//         return 0;
//       })
//       .slice(0, 6);

//     return (
//       <div className="space-y-10">
//         {/* Quick Stats Section */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-5">
//             <div className="flex items-center">
//               <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
//                 <Book className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//               </div>
//               <div>
//                 <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
//                   Total Manga
//                 </h3>
//                 <p className="text-2xl font-bold text-gray-900 dark:text-white">
//                   {mangaList.length}
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-5">
//             <div className="flex items-center">
//               <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
//                 <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
//               </div>
//               <div>
//                 <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
//                   Total Volumes
//                 </h3>
//                 <p className="text-2xl font-bold text-gray-900 dark:text-white">
//                   {mangaList.reduce((total, manga) => total + manga.volumes, 0)}
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-5">
//             <div className="flex items-center">
//               <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4">
//                 <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
//               </div>
//               <div>
//                 <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
//                   Last Updated
//                 </h3>
//                 <p className="text-2xl font-bold text-gray-900 dark:text-white">
//                   {mangaList[0]?.lastModified
//                     ? new Date(mangaList[0].lastModified).toLocaleDateString()
//                     : "Unknown"}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Recently Added Section */}
//         <div>
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
//               <Clock className="h-5 w-5 mr-2 text-orange-500" />
//               Recently Added
//             </h2>
//             <Link
//               href="/manga"
//               className="text-sm text-orange-600 dark:text-orange-400 hover:underline"
//             >
//               View All
//             </Link>
//           </div>
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
//             {recentManga.map((manga) => (
//               <MangaCard key={manga.id} manga={manga} />
//             ))}
//           </div>
//         </div>

//         {/* Full List Section */}
//         <div>
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
//               <Book className="h-5 w-5 mr-2 text-orange-500" />
//               All Manga
//             </h2>
//           </div>
//           <MangaGrid mangaList={mangaList} />
//         </div>
//       </div>
//     );
//   } catch (error) {
//     console.error("Error loading manga list:", error);
//     return (
//       <EmptyState
//         icon={AlertTriangle}
//         title="Failed to load manga list"
//         message={
//           error instanceof Error ? error.message : "An unknown error occurred"
//         }
//         variant="error"
//       />
//     );
//   }
// }

async function HomeStats() {
  const mangaList = await fetchAllManga();
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

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            {recentManga.map((manga) => (
              <Link
                key={manga.id}
                href={`/manga/${encodeURIComponent(manga.id)}`}
                className="flex items-center p-4 hover:opacity-80 dark:hover:bg-gray-750 transition-colors group"
              >
                <div className="w-14 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden relative">
                  {manga.coverImage ? (
                    <Image
                      src={manga.coverImage}
                      alt={manga.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Book className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="ml-4 flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                    {manga.title}
                  </h3>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Book className="w-3.5 h-3.5 mr-1 text-orange-500" />
                      <span>
                        {manga.volumes}{" "}
                        {manga.volumes === 1 ? "volume" : "volumes"}
                      </span>
                    </div>
                    {manga.lastModified && (
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-blue-500" />
                        <span>{formatDate(manga.lastModified)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 hidden sm:block">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    New
                  </span>
                </div>
              </Link>
            ))}
          </div>
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
        title="Welcome to MokuReader"
        subtitle="Your digital manga reading application"
        className="mb-8"
      />

      <Suspense fallback={<p>Loading stats...</p>}>
        <HomeStats />
      </Suspense>
    </div>
  );
}
