import { SearchContent } from "@/components/manga/SearchContent";
import { PageHeader } from "@/components/ui/PageHeader";
import { Suspense } from "react";

export default function SearchPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <PageHeader
                title="Search Manga"
                subtitle="Find manga in your collection"
            />

            <Suspense
                fallback={
                    <div className="text-center py-10">
                        Loading search...
                    </div>
                }
            >
                <SearchContent />
            </Suspense>
        </div>
    );
}
