-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "EditProposal" ADD COLUMN "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Manga" ADD COLUMN "rejectionReason" TEXT;
