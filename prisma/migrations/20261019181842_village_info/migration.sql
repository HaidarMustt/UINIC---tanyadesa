-- CreateEnum
CREATE TYPE "InfoCategory" AS ENUM ('SCHEDULE', 'SERVICE', 'ANNOUNCEMENT', 'CONTACT');

-- CreateTable
CREATE TABLE "village_infos" (
    "id" TEXT NOT NULL,
    "desaId" TEXT NOT NULL,
    "category" "InfoCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dusunId" TEXT,
    "validUntil" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "village_infos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "village_infos_desaId_category_idx" ON "village_infos"("desaId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "village_infos_desaId_title_key" ON "village_infos"("desaId", "title");

-- AddForeignKey
ALTER TABLE "village_infos" ADD CONSTRAINT "village_infos_desaId_fkey" FOREIGN KEY ("desaId") REFERENCES "desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "village_infos" ADD CONSTRAINT "village_infos_dusunId_fkey" FOREIGN KEY ("dusunId") REFERENCES "dusun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "village_infos" ADD CONSTRAINT "village_infos_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
