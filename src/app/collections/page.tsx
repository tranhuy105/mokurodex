import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCollections } from "@/server/actions/content-management";
import { AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";

export default async function CollectionsPage() {
    const collections = await getCollections();

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <PageHeader
                    title="Collections"
                    subtitle="Organize your content into collections"
                    className="mb-0"
                />
                <Link href="/collections/new">
                    <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors">
                        <Plus className="mr-2 h-4 w-4" />
                        New Collection
                    </button>
                </Link>
            </div>

            {!collections || collections.length === 0 ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="No collections found"
                    message="You haven't created any collections yet. Create a collection to organize your content."
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
            ) : (
                <CollectionGrid collections={collections} />
            )}
        </div>
    );
}
