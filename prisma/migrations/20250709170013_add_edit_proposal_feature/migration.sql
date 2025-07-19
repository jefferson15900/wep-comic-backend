-- CreateTable
CREATE TABLE "EditProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "justification" TEXT NOT NULL,
    "title" TEXT,
    "author" TEXT,
    "synopsis" TEXT,
    "coverUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mangaId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    CONSTRAINT "EditProposal_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EditProposal_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "lastEditedById" TEXT,
    CONSTRAINT "Chapter_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Chapter_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);
INSERT INTO "new_Chapter" ("chapterNumber", "createdAt", "id", "language", "lastEditedById", "mangaId", "status", "title") SELECT "chapterNumber", "createdAt", "id", "language", "lastEditedById", "mangaId", "status", "title" FROM "Chapter";
DROP TABLE "Chapter";
ALTER TABLE "new_Chapter" RENAME TO "Chapter";
CREATE UNIQUE INDEX "Chapter_mangaId_chapterNumber_key" ON "Chapter"("mangaId", "chapterNumber");
CREATE TABLE "new_Manga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "lastEditedById" TEXT,
    CONSTRAINT "Manga_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Manga_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);
INSERT INTO "new_Manga" ("author", "coverUrl", "createdAt", "id", "lastEditedById", "status", "synopsis", "title", "updatedAt", "uploaderId") SELECT "author", "coverUrl", "createdAt", "id", "lastEditedById", "status", "synopsis", "title", "updatedAt", "uploaderId" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
