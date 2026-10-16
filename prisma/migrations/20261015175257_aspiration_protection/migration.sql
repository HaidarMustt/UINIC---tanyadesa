-- AlterTable
ALTER TABLE "aspirations" ADD COLUMN     "aiFlag" TEXT,
ADD COLUMN     "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "aspirations_ipHash_createdAt_idx" ON "aspirations"("ipHash", "createdAt");
