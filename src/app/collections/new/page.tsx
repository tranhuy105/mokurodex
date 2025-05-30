import { NewCollectionForm } from "@/components/collections/NewCollectionForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewCollectionPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
            <PageHeader
                title="Create New Collection"
                subtitle="Create a new collection to organize your content"
                className="mb-8"
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                <NewCollectionForm />
            </div>
        </div>
    );
}
