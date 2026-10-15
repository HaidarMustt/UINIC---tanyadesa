/*
  Warnings:

  - A unique constraint covering the columns `[trackingCode]` on the table `aspirations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trackingCode` to the `aspirations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "aspirations" ADD COLUMN     "forwardedTo" TEXT,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "trackingCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "aspirations_trackingCode_key" ON "aspirations"("trackingCode");

-- CreateIndex
CREATE INDEX "aspirations_sessionId_createdAt_idx" ON "aspirations"("sessionId", "createdAt");
