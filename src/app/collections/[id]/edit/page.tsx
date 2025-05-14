import { PageHeader } from "@/components/ui/PageHeader";
import {
  getCollection,
  getMangaByCollection,
} from "@/actions/manga-management-actions";
import { notFound } from "next/navigation";
import { EditCollectionForm } from "@/components/collections/EditCollectionForm";

interface EditCollectionPageProps {
  params: {
    id: string;
  };
}

export default async function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  const p = await Promise.resolve(params);
  const id = p.id;

  // Fetch collection data
  const collection = await getCollection(id);

  if (!collection) {
    notFound();
  }

  // Fetch manga in this collection
  const mangaData = await getMangaByCollection(id);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
      <PageHeader
        title="Edit Collection"
        subtitle="Modify your collection details and manage manga"
        className="mb-8"
      />

      <EditCollectionForm collection={collection} initialManga={mangaData} />
    </div>
  );
}
