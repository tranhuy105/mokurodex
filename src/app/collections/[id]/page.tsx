import {
  getCollection,
  getMangaByCollection,
} from "@/actions/manga-management-prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { MangaGridSkeleton } from "@/components/manga/MangaGridSkeleton";
import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Pencil, BookOpen } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { CollectionActions } from "@/components/collections/CollectionActions";

interface CollectionPageProps {
  params: {
    id: string;
  };
}

async function CollectionContent({ id }: { id: string }) {
  const collection = await getCollection(id);

  if (!collection) {
    notFound();
  }

  // Get all manga in this collection
  const mangaList = await getMangaByCollection(id);

  return (
    <>
      {/* Collection Header */}
      <div className="relative mb-8 group">
        {/* Cover Image or Gradient Background */}
        <div className="absolute inset-0 h-64 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl overflow-hidden transition-all duration-500 ease-in-out group-hover:shadow-lg">
          {collection.coverImage && (
            <Image
              src={collection.coverImage}
              alt={collection.name}
              fill
              className="object-cover opacity-40 transition-transform duration-700 ease-in-out group-hover:scale-105"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        </div>

        {/* Collection Info */}
        <div className="relative pt-36 pb-6 px-6 z-10 text-white">
          <div className="flex items-start justify-between">
            <div className="transform transition-all duration-300 ease-in-out group-hover:translate-y-[-4px]">
              <h1 className="text-3xl font-bold tracking-tight">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="mt-2 text-white/90 max-w-xl">
                  {collection.description}
                </p>
              )}
              <div className="mt-3 flex items-center text-sm text-white/70">
                <BookOpen className="w-4 h-4 mr-1.5" />
                <span>{collection.mangaIds?.length || 0} manga</span>
                <span className="mx-2">•</span>
                <span>
                  Updated {formatDate(new Date(collection.updatedAt))}
                </span>
              </div>
            </div>

            <CollectionActions collection={collection} />
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="mb-6">
        <Link href="/collections">
          <button className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Collections
          </button>
        </Link>
      </div>

      {/* Collection Manga Content */}
      <div className="animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium">Manga in this collection</h2>
          <Link href={`/collections/${id}/edit`}>
            <button className="flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 border border-gray-300 dark:border-gray-600 py-1.5 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit Collection
            </button>
          </Link>
        </div>

        {mangaList.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No manga in this collection"
            message="This collection doesn't have any manga yet. Add some manga to get started."
            variant="warning"
          />
        ) : (
          <MangaGrid mangaList={mangaList} showFilters={false} />
        )}
      </div>
    </>
  );
}

export default function CollectionPage({ params }: CollectionPageProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <Suspense fallback={<CollectionContentSkeleton />}>
        <CollectionContent id={params.id} />
      </Suspense>
    </div>
  );
}

function CollectionContentSkeleton() {
  return (
    <>
      {/* Skeleton for Collection Header */}
      <div className="relative mb-8">
        <div className="absolute inset-0 h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        <div className="relative pt-36 pb-6 px-6 z-10">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Skeleton for Back Button */}
      <div className="mb-6">
        <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Skeleton for Manga Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>

        <MangaGridSkeleton count={8} />
      </div>
    </>
  );
}

// Add this to your global CSS file:
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fadeIn {
//   animation: fadeIn 0.5s ease-out forwards;
// }
