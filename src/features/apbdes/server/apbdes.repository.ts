// Database access for APBDes. Only Prisma queries live here, no business rules.

import { db } from "@/lib/db";
import type { ParsedBudgetItem } from "../types";

// A parsed item whose dusun name has been resolved to a database id.
export type NewBudgetItem = Omit<ParsedBudgetItem, "dusun"> & { dusunId: string | null };

export interface NewDocument {
  desaId: string;
  fiscalYear: number;
  version: number;
  title: string;
  realizedAsOf: Date | null;
  fileName: string;
  fileUrl: string;
  uploaderId: string;
}

export function findDesaWithDusunsBySlug(slug: string) {
  return db.desa.findUnique({
    where: { slug },
    include: { dusuns: true },
  });
}

export async function getNextDocumentVersion(desaId: string, fiscalYear: number): Promise<number> {
  const latest = await db.apbdesDocument.findFirst({
    where: { desaId, fiscalYear },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}

// Saves the document and all its rows together: either everything is saved, or nothing.
export function createDocumentWithItems(document: NewDocument, items: NewBudgetItem[]) {
  return db.$transaction(async (tx) => {
    const created = await tx.apbdesDocument.create({
      data: { ...document, fileType: "xlsx", status: "IN_REVIEW" },
    });

    await tx.budgetItem.createMany({
      data: items.map((item, index) => ({
        documentId: created.id,
        accountCode: item.accountCode,
        entryType: item.entryType,
        sectorCode: item.sectorCode,
        description: item.description,
        dusunId: item.dusunId,
        rt: item.rt,
        fundSource: item.fundSource,
        budget: BigInt(item.budget),
        realized: BigInt(item.realized),
        status: item.status,
        note: item.note,
        sourceRow: item.sourceRow,
        sortOrder: index + 1,
      })),
    });

    return created;
  });
}

// Publishes one document and archives the previously published one for the same year.
export function publishDocument(documentId: string, publisherId: string) {
  return db.$transaction(async (tx) => {
    const document = await tx.apbdesDocument.findUniqueOrThrow({ where: { id: documentId } });

    await tx.apbdesDocument.updateMany({
      where: { desaId: document.desaId, fiscalYear: document.fiscalYear, status: "PUBLISHED" },
      data: { status: "ARCHIVED" },
    });

    return tx.apbdesDocument.update({
      where: { id: documentId },
      data: { status: "PUBLISHED", publisherId, publishedAt: new Date() },
    });
  });
}

// The latest published APBDes of a desa, with all rows and their dusun.
export function findPublishedDocument(desaSlug: string) {
  return db.apbdesDocument.findFirst({
    where: { status: "PUBLISHED", desa: { slug: desaSlug } },
    orderBy: [{ fiscalYear: "desc" }, { version: "desc" }],
    include: {
      desa: true,
      items: { include: { dusun: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}