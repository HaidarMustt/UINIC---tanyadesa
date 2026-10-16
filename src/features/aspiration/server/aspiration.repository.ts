// Database access for aspirations. Only Prisma queries live here.

import type { AspirationStatus } from "@/generated/prisma/client";
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

export function countIpAspirationsSince(ipHash: string, since: Date) {
  return db.aspiration.count({ where: { ipHash, createdAt: { gte: since } } });
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
  ipHash: string | null;
  aiFlag: string | null;
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

// ---------------------------------------------------------------- panel (officers)

// Always scoped by desa: an officer only ever sees their own desa's aspirations.
export function findAspirationsForDesa(desaId: string, status: AspirationStatus | null) {
  return db.aspiration.findMany({
    where: { desaId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      content: true,
      status: true,
      rt: true,
      aiFlag: true,
      aiConfidence: true,
      contact: true,
      createdAt: true,
      dusun: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
}

export function countAspirationsByStatus(desaId: string) {
  return db.aspiration.groupBy({ by: ["status"], where: { desaId }, _count: { _all: true } });
}

export function findAspirationForOfficer(id: string, desaId: string) {
  return db.aspiration.findFirst({
    where: { id, desaId },
    include: {
      dusun: { select: { name: true } },
      category: { select: { id: true, name: true } },
      relatedBudgetItem: { select: { accountCode: true, description: true, budget: true, status: true, note: true } },
      responses: {
        orderBy: { createdAt: "asc" },
        select: { id: true, content: true, isPublic: true, createdAt: true, user: { select: { name: true, role: true } } },
      },
    },
  });
}

export function findCategoriesForDesa(desaId: string) {
  return db.aspirationCategory.findMany({ where: { desaId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export function updateAspiration(
  id: string,
  data: { categoryId?: string | null; forwardedTo?: string | null; status?: AspirationStatus },
) {
  return db.aspiration.update({ where: { id }, data });
}

export function createResponse(aspirationId: string, userId: string, content: string, isPublic: boolean) {
  return db.aspirationResponse.create({ data: { aspirationId, userId, content, isPublic } });
}
