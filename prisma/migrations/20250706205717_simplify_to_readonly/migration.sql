/*
  Warnings:

  - You are about to drop the `MangaEditProposal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `original_chapter_id` on the `Chapter` table. All the data in the column will be lost.
  - You are about to drop the column `proposerId` on the `Chapter` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MangaEditProposal";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chapterNumber" REAL NOT NULL,
    "title" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mangaId" TEXT NOT NULL,
    CONSTRAINT "Chapter_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Chapter" ("chapterNumber", "createdAt", "id", "language", "mangaId", "status", "title") SELECT "chapterNumber", "createdAt", "id", "language", "mangaId", "status", "title" FROM "Chapter";
DROP TABLE "Chapter";
ALTER TABLE "new_Chapter" RENAME TO "Chapter";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
