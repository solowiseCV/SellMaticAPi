-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "humanTakeover" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "takeoverAt" TIMESTAMP(3),
ADD COLUMN     "takeoverResumedAt" TIMESTAMP(3);
