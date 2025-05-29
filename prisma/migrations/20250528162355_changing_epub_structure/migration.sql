/*
  Warnings:

  - You are about to drop the `EpubChapter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EpubContent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `chapterId` on the `EpubReadingHistory` table. All the data in the column will be lost.
  - Added the required column `chapterHref` to the `EpubReadingHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `extractedPath` to the `EpubVolume` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "EpubChapter_epubVolumeId_idx";

-- DropIndex
DROP INDEX "EpubContent_chapterId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EpubChapter";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EpubContent";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EpubReadingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "epubVolumeId" TEXT NOT NULL,
    "chapterHref" TEXT NOT NULL,
    "position" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL,
    CONSTRAINT "EpubReadingHistory_epubVolumeId_fkey" FOREIGN KEY ("epubVolumeId") REFERENCES "EpubVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EpubReadingHistory" ("epubVolumeId", "id", "position", "timestamp") SELECT "epubVolumeId", "id", "position", "timestamp" FROM "EpubReadingHistory";
DROP TABLE "EpubReadingHistory";
ALTER TABLE "new_EpubReadingHistory" RENAME TO "EpubReadingHistory";
CREATE INDEX "EpubReadingHistory_epubVolumeId_idx" ON "EpubReadingHistory"("epubVolumeId");
CREATE TABLE "new_EpubVolume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
    "volumeNumber" INTEGER NOT NULL,
    "volumeTitle" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "extractedPath" TEXT NOT NULL,
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
