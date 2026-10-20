// Database access for Info desa. Every query is limited to one desa.

import { db } from "@/lib/db";
import type { InfoCategory } from "../constants";

export interface InfoData {
  category: InfoCategory;
  title: string;
  content: string;
  dusunId: string | null;
  validUntil: Date | null;
}

const LIST_SELECT = {
  id: true,
  category: true,
  title: true,
  content: true,
  validUntil: true,
  isPublished: true,
  updatedAt: true,
  dusun: { select: { id: true, name: true } },
  updatedBy: { select: { name: true } },
} as const;

export function findInfosForDesa(desaId: string) {
  return db.villageInfo.findMany({
    where: { desaId },
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: LIST_SELECT,
  });
}

export function findInfoForDesa(id: string, desaId: string) {
  return db.villageInfo.findFirst({ where: { id, desaId }, select: LIST_SELECT });
}

export function findDusunsForDesa(desaId: string) {
  return db.dusun.findMany({ where: { desaId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export function createInfo(desaId: string, userId: string, data: InfoData) {
  return db.villageInfo.create({ data: { ...data, desaId, updatedById: userId }, select: { id: true } });
}

export function updateInfo(id: string, userId: string, data: Partial<InfoData> & { isPublished?: boolean }) {
  return db.villageInfo.update({ where: { id }, data: { ...data, updatedById: userId }, select: { id: true } });
}

// Published entries for the Tanya page. Expired ones are filtered by the Q&A code (isInfoActive).
export async function findPublishedInfos(desaId: string) {
  const rows = await db.villageInfo.findMany({
    where: { desaId, isPublished: true },
    select: { category: true, title: true, content: true, validUntil: true, updatedAt: true, dusun: { select: { name: true } } },
  });
  return rows.map(({ dusun, ...row }) => ({ ...row, dusun: dusun?.name ?? null }));
}
