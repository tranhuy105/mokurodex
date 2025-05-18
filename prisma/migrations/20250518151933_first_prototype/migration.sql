-- CreateTable
CREATE TABLE "Manga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "volumes" INTEGER NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "addedDate" DATETIME NOT NULL,
    "lastModified" DATETIME NOT NULL,
    "directoryPath" TEXT NOT NULL,
    "lastScanned" DATETIME NOT NULL,
    "scanStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT
);

-- CreateTable
CREATE TABLE "Volume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
    "volumeNumber" INTEGER NOT NULL,
    "volumeTitle" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "coverImage" TEXT,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "addedDate" DATETIME NOT NULL,
    "lastModified" DATETIME NOT NULL,
    "volumeUuid" TEXT NOT NULL,
    "previewImages" TEXT,
    CONSTRAINT "Volume_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volumeId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    CONSTRAINT "Page_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TextBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "boxX" REAL NOT NULL,
    "boxY" REAL NOT NULL,
    "boxWidth" REAL NOT NULL,
    "boxHeight" REAL NOT NULL,
    "text" TEXT NOT NULL,
    "fontSize" REAL NOT NULL,
    "isVertical" BOOLEAN NOT NULL DEFAULT false,
    "linesCoords" TEXT,
    CONSTRAINT "TextBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MangaTag" (
    "mangaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("mangaId", "tagId"),
    CONSTRAINT "MangaTag_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MangaTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionManga" (
    "collectionId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,

    PRIMARY KEY ("collectionId", "mangaId"),
    CONSTRAINT "CollectionManga_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionManga_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserMangaMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
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
    CONSTRAINT "UserMangaMetadata_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
    "volumeId" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    CONSTRAINT "ReadingHistory_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingHistory_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "darkMode" BOOLEAN NOT NULL DEFAULT true,
    "invertColors" BOOLEAN NOT NULL DEFAULT false,
    "rightToLeft" BOOLEAN NOT NULL DEFAULT false,
    "hasCover" BOOLEAN NOT NULL DEFAULT false,
    "showTooltips" BOOLEAN NOT NULL DEFAULT true,
    "ankiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fontSize" TEXT NOT NULL DEFAULT 'auto',
    "readingMode" TEXT NOT NULL DEFAULT 'singlePage',
    "animatePageTurns" BOOLEAN NOT NULL DEFAULT true,
    "highlightColor" TEXT NOT NULL DEFAULT '#FFD700',
    "readerBackground" TEXT NOT NULL DEFAULT '#FFFFFF',
    "pageMargin" INTEGER NOT NULL DEFAULT 20,
    "furiganaDisplay" TEXT NOT NULL DEFAULT 'hover',
    "autoSavePosition" BOOLEAN NOT NULL DEFAULT true,
    "dictionaryProvider" TEXT NOT NULL DEFAULT 'jisho',
    "customDictionaryUrl" TEXT,
    "pageNavigationMethod" TEXT NOT NULL DEFAULT 'click',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Volume_mangaId_idx" ON "Volume"("mangaId");

-- CreateIndex
CREATE INDEX "Page_volumeId_idx" ON "Page"("volumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_volumeId_pageNumber_key" ON "Page"("volumeId", "pageNumber");

-- CreateIndex
CREATE INDEX "TextBlock_pageId_idx" ON "TextBlock"("pageId");

-- CreateIndex
CREATE INDEX "MangaTag_mangaId_idx" ON "MangaTag"("mangaId");

-- CreateIndex
CREATE INDEX "MangaTag_tagId_idx" ON "MangaTag"("tagId");

-- CreateIndex
CREATE INDEX "CollectionManga_collectionId_idx" ON "CollectionManga"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionManga_mangaId_idx" ON "CollectionManga"("mangaId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMangaMetadata_mangaId_key" ON "UserMangaMetadata"("mangaId");

-- CreateIndex
CREATE INDEX "ReadingHistory_mangaId_idx" ON "ReadingHistory"("mangaId");

-- CreateIndex
CREATE INDEX "ReadingHistory_volumeId_idx" ON "ReadingHistory"("volumeId");
