import { PageHeader } from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MangaScanController } from "@/components/manga/MangaScanController";
import { SettingsNav } from "@/components/ui/SettingsNav";

export default function ImportSettingsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <PageHeader
        title="Manga Import Settings"
        subtitle="Scan and import manga into the database"
        className="mb-4"
      />

      <SettingsNav />

      <div className="grid gap-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>How Importing Works</CardTitle>
            <CardDescription>
              The import process scans your manga directory and imports manga
              into the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Steps:</h3>
                <ol className="list-decimal ml-5 mt-2 space-y-2">
                  <li>
                    <strong>Scan:</strong> The system scans your manga directory
                    for .mokuro files.
                  </li>
                  <li>
                    <strong>Import:</strong> Metadata is extracted and stored in
                    the database.
                  </li>
                  <li>
                    <strong>Reading:</strong> After importing, manga can be
                    accessed via the library.
                  </li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium">Benefits:</h3>
                <ul className="list-disc ml-5 mt-2 space-y-2">
                  <li>
                    Faster loading times (no need to scan the file system on
                    each request)
                  </li>
                  <li>
                    Support for additional metadata like tags, collections, and
                    reading progress
                  </li>
                  <li>Better performance when dealing with large libraries</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <MangaScanController />
      </div>
    </div>
  );
}
