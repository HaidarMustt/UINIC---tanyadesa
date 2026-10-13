-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OPERATOR', 'BPD', 'ADMIN');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'IN_REVIEW', 'PUBLISHED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('REVENUE', 'EXPENDITURE', 'FINANCING_RECEIPT', 'FINANCING_EXPENDITURE');

-- CreateEnum
CREATE TYPE "FundSource" AS ENUM ('DD', 'ADD', 'PADES', 'BHP', 'BANKEU_KAB', 'BANKEU_PROV', 'SILPA', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PARTIALLY_RECEIVED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "AnswerStatus" AS ENUM ('ANSWERED', 'NOT_FOUND', 'REFUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "AspirationStatus" AS ENUM ('NEW', 'FORWARDED', 'RESPONDED', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "desa" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "regency" TEXT NOT NULL,
    "province" TEXT,
    "population" INTEGER,
    "householdCount" INTEGER,
    "isSimulation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dusun" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rts" TEXT[],

    CONSTRAINT "dusun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "desaId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apbdes_documents" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "realizedAsOf" TIMESTAMP(3),
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorMessage" TEXT,
    "aiSummary" TEXT,
    "aiSummaryCreatedAt" TIMESTAMP(3),
    "uploaderId" TEXT NOT NULL,
    "publisherId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apbdes_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "code" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "entryType" "EntryType" NOT NULL,
    "sectorCode" INTEGER,
    "description" TEXT NOT NULL,
    "dusunId" TEXT,
    "rt" TEXT,
    "fundSource" "FundSource" NOT NULL,
    "budget" BIGINT NOT NULL,
    "realized" BIGINT NOT NULL DEFAULT 0,
    "status" "ActivityStatus" NOT NULL,
    "note" TEXT,
    "sourceRow" INTEGER,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "intent" JSONB,
    "answer" TEXT,
    "status" "AnswerStatus" NOT NULL,
    "durationMs" INTEGER,
    "isHelpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer_sources" (
    "questionId" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,

    CONSTRAINT "answer_sources_pkey" PRIMARY KEY ("questionId","budgetItemId")
);

-- CreateTable
CREATE TABLE "aspiration_categories" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "aspiration_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aspirations" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "dusunId" TEXT,
    "rt" TEXT,
    "content" TEXT NOT NULL,
    "senderName" TEXT,
    "contact" TEXT,
    "categoryId" TEXT,
    "aiConfidence" DOUBLE PRECISION,
    "relatedBudgetItemId" TEXT,
    "status" "AspirationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aspirations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aspiration_responses" (
    "id" TEXT NOT NULL,
    "aspirationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aspiration_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "desa_slug_key" ON "desa"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "dusun_desaId_name_key" ON "dusun"("desaId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_desaId_idx" ON "users"("desaId");

-- CreateIndex
CREATE INDEX "apbdes_documents_desaId_status_idx" ON "apbdes_documents"("desaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "apbdes_documents_desaId_fiscalYear_version_key" ON "apbdes_documents"("desaId", "fiscalYear", "version");

-- CreateIndex
CREATE INDEX "budget_items_documentId_entryType_idx" ON "budget_items"("documentId", "entryType");

-- CreateIndex
CREATE INDEX "budget_items_documentId_sectorCode_idx" ON "budget_items"("documentId", "sectorCode");

-- CreateIndex
CREATE INDEX "budget_items_documentId_dusunId_idx" ON "budget_items"("documentId", "dusunId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_items_documentId_accountCode_key" ON "budget_items"("documentId", "accountCode");

-- CreateIndex
CREATE INDEX "questions_desaId_createdAt_idx" ON "questions"("desaId", "createdAt");

-- CreateIndex
CREATE INDEX "questions_sessionId_createdAt_idx" ON "questions"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "aspiration_categories_desaId_name_key" ON "aspiration_categories"("desaId", "name");

-- CreateIndex
CREATE INDEX "aspirations_desaId_status_idx" ON "aspirations"("desaId", "status");

-- CreateIndex
CREATE INDEX "aspirations_desaId_categoryId_idx" ON "aspirations"("desaId", "categoryId");

-- CreateIndex
CREATE INDEX "aspiration_responses_aspirationId_idx" ON "aspiration_responses"("aspirationId");

-- CreateIndex
CREATE INDEX "activity_logs_entity_entityId_idx" ON "activity_logs"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "dusun" ADD CONSTRAINT "dusun_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apbdes_documents" ADD CONSTRAINT "apbdes_documents_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apbdes_documents" ADD CONSTRAINT "apbdes_documents_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apbdes_documents" ADD CONSTRAINT "apbdes_documents_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "apbdes_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_sectorCode_fkey" FOREIGN KEY ("sectorCode") REFERENCES "sectors"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_dusunId_fkey" FOREIGN KEY ("dusunId") REFERENCES "dusun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "apbdes_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_sources" ADD CONSTRAINT "answer_sources_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_sources" ADD CONSTRAINT "answer_sources_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "budget_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspiration_categories" ADD CONSTRAINT "aspiration_categories_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspirations" ADD CONSTRAINT "aspirations_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspirations" ADD CONSTRAINT "aspirations_dusunId_fkey" FOREIGN KEY ("dusunId") REFERENCES "dusun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspirations" ADD CONSTRAINT "aspirations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "aspiration_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspirations" ADD CONSTRAINT "aspirations_relatedBudgetItemId_fkey" FOREIGN KEY ("relatedBudgetItemId") REFERENCES "budget_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspiration_responses" ADD CONSTRAINT "aspiration_responses_aspirationId_fkey" FOREIGN KEY ("aspirationId") REFERENCES "aspirations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aspiration_responses" ADD CONSTRAINT "aspiration_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
