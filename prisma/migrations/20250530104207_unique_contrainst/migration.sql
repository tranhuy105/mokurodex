/*
  Warnings:

  - A unique constraint covering the columns `[collectionId,contentId]` on the table `CollectionContent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contentId,tagId]` on the table `ContentTag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CollectionContent_collectionId_contentId_key" ON "CollectionContent"("collectionId", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTag_contentId_tagId_key" ON "ContentTag"("contentId", "tagId");
