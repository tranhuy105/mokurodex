-- CreateTable
CREATE TABLE "EpubVolume" (
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

-- CreateTable
CREATE TABLE "EpubChapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "epubVolumeId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    CONSTRAINT "EpubChapter_epubVolumeId_fkey" FOREIGN KEY ("epubVolumeId") REFERENCES "EpubVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EpubContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "styleSheets" TEXT,
    "images" TEXT,
    CONSTRAINT "EpubContent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "EpubChapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EpubReadingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "epubVolumeId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "position" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL,
    CONSTRAINT "EpubReadingHistory_epubVolumeId_fkey" FOREIGN KEY ("epubVolumeId") REFERENCES "EpubVolume" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EpubReadingHistory_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "EpubChapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Manga" (
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
INSERT INTO "new_Manga" ("addedDate", "coverImage", "directoryPath", "errorMessage", "id", "lastModified", "lastScanned", "scanStatus", "title", "volumes") SELECT "addedDate", "coverImage", "directoryPath", "errorMessage", "id", "lastModified", "lastScanned", "scanStatus", "title", "volumes" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EpubVolume_mangaId_idx" ON "EpubVolume"("mangaId");

-- CreateIndex
CREATE INDEX "EpubChapter_epubVolumeId_idx" ON "EpubChapter"("epubVolumeId");

-- CreateIndex
CREATE INDEX "EpubContent_chapterId_idx" ON "EpubContent"("chapterId");

-- CreateIndex
CREATE INDEX "EpubReadingHistory_epubVolumeId_idx" ON "EpubReadingHistory"("epubVolumeId");

-- CreateIndex
CREATE INDEX "EpubReadingHistory_chapterId_idx" ON "EpubReadingHistory"("chapterId");
