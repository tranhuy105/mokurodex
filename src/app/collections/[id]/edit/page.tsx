import { PageHeader } from "@/components/ui/PageHeader";
import {
  getCollection,
  getMangaByCollection,
} from "@/actions/manga-management-prisma";
import { notFound } from "next/navigation";
import { EditCollectionForm } from "@/components/collections/EditCollectionForm";
import { Suspense } from "react";

interface EditCollectionPageProps {
  params: {
    id: string;
  };
}

function EditCollectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex items-center gap-6">
              <div className="h-40 w-40 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function EditCollectionContent({ id }: { id: string }) {
  // Fetch collection data
  const collection = await getCollection(id);

  if (!collection) {
    notFound();
  }

  // Fetch manga in this collection
  const mangaData = await getMangaByCollection(id);

  return (
    <EditCollectionForm collection={collection} initialManga={mangaData} />
  );
}

export default function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      <PageHeader
        title="Edit Collection"
        subtitle="Modify your collection details and manage manga"
        className="mb-8"
      />

      <Suspense fallback={<EditCollectionSkeleton />}>
        <EditCollectionContent id={params.id} />
      </Suspense>
    </div>
  );
}
