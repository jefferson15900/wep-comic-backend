-- CreateTable
CREATE TABLE "MangaEditProposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mangaId" TEXT NOT NULL,
    "proposerId" TEXT NOT NULL,
    "title" TEXT,
    "author" TEXT,
    "synopsis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MangaEditProposal_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MangaEditProposal_proposerId_fkey" FOREIGN KEY ("proposerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
