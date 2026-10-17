-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "intentVersion" TEXT;

-- CreateIndex
CREATE INDEX "questions_documentId_intentVersion_idx" ON "questions"("documentId", "intentVersion");
