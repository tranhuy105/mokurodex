import { AlertTriangle, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCollections } from "@/actions/manga-management-prisma";
import { Suspense } from "react";
import Link from "next/link";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { CollectionGridSkeleton } from "@/components/collections/CollectionGridSkeleton";

// Main content component
async function CollectionsContent() {
  try {
    const collections = await getCollections();

    if (collections.length === 0) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title="No collections found"
          message="You haven't created any collections yet. Create a collection to organize your manga."
          variant="warning"
          action={
            <Link href="/collections/new">
              <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors">
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </button>
            </Link>
          }
        />
      );
    }

    return <CollectionGrid collections={collections} />;
  } catch (error) {
    console.error("Error loading collections:", error);
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Failed to load collections"
        message={error instanceof Error ? error.message : "Unknown error"}
        variant="error"
      />
    );
  }
}

export default function CollectionsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <PageHeader
          title="Collections"
          subtitle="Organize your manga into collections"
          className="mb-0"
        />
        <Link href="/collections/new">
          <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </button>
        </Link>
      </div>

      <Suspense fallback={<CollectionGridSkeleton count={6} />}>
        <CollectionsContent />
      </Suspense>
    </div>
  );
}
