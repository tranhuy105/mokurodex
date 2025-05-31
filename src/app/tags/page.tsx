import { TagManagement } from "@/components/tags/TagManagement";
import { PageHeader } from "@/components/ui/PageHeader";

export default function TagsSettingsPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <PageHeader
                title="Tag Management"
                subtitle="Create, edit, and organize your content tags"
                className="mb-4"
            />

            <div className="mt-6">
                <TagManagement />
            </div>
        </div>
    );
}
