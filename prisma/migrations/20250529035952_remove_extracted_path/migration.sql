/*
  Warnings:

  - You are about to drop the column `extractedPath` on the `EpubVolume` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EpubVolume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
    "volumeNumber" INTEGER NOT NULL,
    "volumeTitle" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "coverImage" TEXT,
    "addedDate" DATETIME NOT NULL,
    "lastModified" DATETIME NOT NULL,
    "metadata" TEXT,
    CONSTRAINT "EpubVolume_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EpubVolume" ("addedDate", "coverImage", "filePath", "id", "lastModified", "mangaId", "metadata", "volumeNumber", "volumeTitle") SELECT "addedDate", "coverImage", "filePath", "id", "lastModified", "mangaId", "metadata", "volumeNumber", "volumeTitle" FROM "EpubVolume";
DROP TABLE "EpubVolume";
ALTER TABLE "new_EpubVolume" RENAME TO "EpubVolume";
CREATE INDEX "EpubVolume_mangaId_idx" ON "EpubVolume"("mangaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
