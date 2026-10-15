// Database access for aspirations. Only Prisma queries live here.

import { db } from "@/lib/db";

export function findDesaForAspirations(slug: string) {
  return db.desa.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      isSimulation: true,
      dusuns: { select: { id: true, name: true, rts: true }, orderBy: { name: "asc" } },
      categories: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });
}

export function countSessionAspirationsSince(sessionId: string, since: Date) {
  return db.aspiration.count({ where: { sessionId, createdAt: { gte: since } } });
}

export function countDesaAspirationsSince(desaId: string, since: Date) {
  return db.aspiration.count({ where: { desaId, createdAt: { gte: since } } });
}

export interface NewAspiration {
  desaId: string;
  dusunId: string | null;
  rt: string | null;
  content: string;
  senderName: string | null;
  contact: string | null;
  categoryId: string | null;
  aiConfidence: number | null;
  relatedBudgetItemId: string | null;
  trackingCode: string;
  sessionId: string;
}

export function createAspiration(data: NewAspiration) {
  return db.aspiration.create({ data, select: { trackingCode: true, status: true } });
}

// What the resident may see. Contact and sender name are deliberately NOT selected.
export function findAspirationForResident(desaSlug: string, trackingCode: string) {
  return db.aspiration.findFirst({
    where: { trackingCode, desa: { slug: desaSlug } },
    select: {
      content: true,
      rt: true,
      status: true,
      forwardedTo: true,
      createdAt: true,
      updatedAt: true,
      dusun: { select: { name: true } },
      category: { select: { name: true } },
      relatedBudgetItem: {
        select: { accountCode: true, description: true, budget: true, realized: true, status: true, note: true },
      },
      responses: {
        where: { isPublic: true },
        orderBy: { createdAt: "asc" },
        select: { content: true, createdAt: true, user: { select: { name: true, role: true } } },
      },
    },
  });
}
