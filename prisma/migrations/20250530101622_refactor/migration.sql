/*
  Warnings:

  - You are about to drop the `CollectionManga` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EpubReadingHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EpubVolume` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Manga` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MangaTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserMangaMetadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `mangaId` on the `ReadingHistory` table. All the data in the column will be lost.
  - You are about to drop the column `page` on the `ReadingHistory` table. All the data in the column will be lost.
  - You are about to drop the column `mangaId` on the `Volume` table. All the data in the column will be lost.
  - Added the required column `contentId` to the `ReadingHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `ReadingHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentId` to the `Volume` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CollectionManga_mangaId_idx";

-- DropIndex
DROP INDEX "CollectionManga_collectionId_idx";

-- DropIndex
DROP INDEX "EpubReadingHistory_epubVolumeId_idx";

-- DropIndex
DROP INDEX "EpubVolume_mangaId_idx";

-- DropIndex
DROP INDEX "MangaTag_tagId_idx";

-- DropIndex
DROP INDEX "MangaTag_mangaId_idx";

-- DropIndex
DROP INDEX "UserMangaMetadata_mangaId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CollectionManga";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EpubReadingHistory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EpubVolume";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Manga";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MangaTag";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "UserMangaMetadata";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "volumes" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "addedDate" DATETIME NOT NULL,
    "lastModified" DATETIME NOT NULL,
    "directoryPath" TEXT NOT NULL,
    "lastScanned" DATETIME NOT NULL,
    "scanStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'manga'
);

-- CreateTable
CREATE TABLE "ContentTag" (
    "contentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("contentId", "tagId"),
    CONSTRAINT "ContentTag_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionContent" (
    "collectionId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,

    PRIMARY KEY ("collectionId", "contentId"),
    CONSTRAINT "CollectionContent_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionContent_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserContentMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "rating" REAL,
    "progress" INTEGER,
    "status" TEXT,
    "notes" TEXT,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "isNsfw" BOOLEAN NOT NULL DEFAULT false,
    "customCover" TEXT,
    "author" TEXT,
    "artist" TEXT,
    "releaseYear" INTEGER,
    "publisher" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserContentMetadata_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReadingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "chapterHref" TEXT,
    "timestamp" DATETIME NOT NULL,
    CONSTRAINT "ReadingHistory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingHistory_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingHistory" ("id", "timestamp", "volumeId") SELECT "id", "timestamp", "volumeId" FROM "ReadingHistory";
DROP TABLE "ReadingHistory";
ALTER TABLE "new_ReadingHistory" RENAME TO "ReadingHistory";
CREATE INDEX "ReadingHistory_contentId_idx" ON "ReadingHistory"("contentId");
CREATE INDEX "ReadingHistory_volumeId_idx" ON "ReadingHistory"("volumeId");
CREATE TABLE "new_Volume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contentId" TEXT NOT NULL,
    "volumeNumber" INTEGER NOT NULL,
    "volumeTitle" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "coverImage" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "addedDate" DATETIME NOT NULL,
    "lastModified" DATETIME NOT NULL,
    "volumeUuid" TEXT NOT NULL,
    "previewImages" TEXT,
    "volumeType" TEXT NOT NULL DEFAULT 'manga',
    "metadata" TEXT,
    CONSTRAINT "Volume_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Volume" ("addedDate", "coverImage", "filePath", "id", "lastModified", "pageCount", "previewImages", "volumeNumber", "volumeTitle", "volumeUuid") SELECT "addedDate", "coverImage", "filePath", "id", "lastModified", "pageCount", "previewImages", "volumeNumber", "volumeTitle", "volumeUuid" FROM "Volume";
DROP TABLE "Volume";
ALTER TABLE "new_Volume" RENAME TO "Volume";
CREATE INDEX "Volume_contentId_idx" ON "Volume"("contentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ContentTag_contentId_idx" ON "ContentTag"("contentId");

-- CreateIndex
CREATE INDEX "ContentTag_tagId_idx" ON "ContentTag"("tagId");

-- CreateIndex
CREATE INDEX "CollectionContent_collectionId_idx" ON "CollectionContent"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionContent_contentId_idx" ON "CollectionContent"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserContentMetadata_contentId_key" ON "UserContentMetadata"("contentId");
