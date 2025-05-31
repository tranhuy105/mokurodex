"use client";

import { ImportControllerWithProvider } from "@/components/manga/ImportController";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettingsNav } from "@/components/ui/SettingsNav";

export default function ImportSettingsPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
            <PageHeader
                title="Content Import"
                subtitle="Import manga and light novels into your library"
                className="mb-4"
            />

            <SettingsNav />

            <ImportControllerWithProvider />
        </div>
    );
}
