// What officers do with Info desa. Every function checks the entry belongs to the
// officer's own desa, and records the change in the audit log.

import { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity-log";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { isInfoActive } from "../lib/active";
import type { InfoFormInput } from "../schemas";
import { createInfo, findDusunsForDesa, findInfoForDesa, findInfosForDesa, updateInfo } from "./info.repository";

export interface Officer {
  id: string;
  desa: { id: string } | null;
}

function desaOf(officer: Officer) {
  if (!officer.desa) throw new ValidationError("Akun ini tidak terhubung ke desa mana pun.");
  return officer.desa;
}

export async function getInfoPanel(officer: Officer, selectedId: string | null) {
  const desa = desaOf(officer);
  const [rows, dusuns, selected] = await Promise.all([
    findInfosForDesa(desa.id),
    findDusunsForDesa(desa.id),
    selectedId ? findInfoForDesa(selectedId, desa.id) : Promise.resolve(null),
  ]);
  const now = new Date();
  const list = rows.map((row) => ({ ...row, isExpired: !isInfoActive(row.validUntil, now) }));
  return { list, dusuns, selected };
}

export async function saveInfo(officer: Officer, input: InfoFormInput): Promise<"created" | "updated"> {
  const desa = desaOf(officer);

  // A dusun from another desa could be posted by editing the form; refuse it.
  if (input.dusunId) {
    const dusuns = await findDusunsForDesa(desa.id);
    if (!dusuns.some((dusun) => dusun.id === input.dusunId)) throw new ValidationError("Dusun tidak dikenal.");
  }

  const data = {
    category: input.category,
    title: input.title,
    content: input.content,
    dusunId: input.dusunId,
    validUntil: input.validUntil,
  };

  try {
    if (input.id) {
      if (!(await findInfoForDesa(input.id, desa.id))) throw new NotFoundError("Info tidak ditemukan.");
      await updateInfo(input.id, officer.id, data);
      await logActivity({ userId: officer.id, action: "UPDATE_INFO", entity: "VillageInfo", entityId: input.id, details: { title: input.title } });
      return "updated";
    }
    const created = await createInfo(desa.id, officer.id, data);
    await logActivity({ userId: officer.id, action: "CREATE_INFO", entity: "VillageInfo", entityId: created.id, details: { title: input.title } });
    return "created";
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ValidationError("Judul itu sudah dipakai info lain. Pakai judul yang berbeda.");
    }
    throw error;
  }
}

// Hiding instead of deleting: the entry and its history stay, and it can be shown again.
export async function setInfoPublished(officer: Officer, id: string, isPublished: boolean) {
  const desa = desaOf(officer);
  if (!(await findInfoForDesa(id, desa.id))) throw new NotFoundError("Info tidak ditemukan.");
  await updateInfo(id, officer.id, { isPublished });
  await logActivity({
    userId: officer.id,
    action: isPublished ? "SHOW_INFO" : "HIDE_INFO",
    entity: "VillageInfo",
    entityId: id,
  });
}
