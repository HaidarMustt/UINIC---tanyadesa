// What officers do with aspirations. Every function checks the aspiration belongs to the
// officer's own desa, and records what was done in the audit log.

import type { AspirationStatus } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity-log";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { FORWARD_TARGETS } from "../constants";
import { LOW_CONFIDENCE } from "../lib/categorize";
import {
  countAspirationsByStatus,
  createResponse,
  findAspirationForOfficer,
  findAspirationsForDesa,
  findCategoriesForDesa,
  updateAspiration,
} from "./aspiration.repository";

export interface Officer {
  id: string;
  role: "OPERATOR" | "BPD" | "ADMIN";
  desa: { id: string } | null;
}

function desaOf(officer: Officer) {
  if (!officer.desa) throw new ValidationError("Akun ini tidak terhubung ke desa mana pun.");
  return officer.desa;
}

export async function getInbox(officer: Officer, status: AspirationStatus | null, selectedId: string | null) {
  const desa = desaOf(officer);
  const [rows, counts, categories] = await Promise.all([
    findAspirationsForDesa(desa.id, status),
    countAspirationsByStatus(desa.id),
    findCategoriesForDesa(desa.id),
  ]);

  const list = rows.map((row) => ({
    ...row,
    canBeContacted: row.contact !== null,
    needsCategoryCheck: row.category === null || (row.aiConfidence ?? 0) < LOW_CONFIDENCE,
    contact: undefined, // the list never needs the contact itself
  }));

  const selected = selectedId ? await findAspirationForOfficer(selectedId, desa.id) : null;
  const countByStatus = Object.fromEntries(counts.map((count) => [count.status, count._count._all]));

  return {
    list,
    countByStatus,
    categories,
    selected: selected
      ? {
          ...selected,
          needsCategoryCheck: selected.category === null || (selected.aiConfidence ?? 0) < LOW_CONFIDENCE,
          relatedBudgetItem: selected.relatedBudgetItem
            ? { ...selected.relatedBudgetItem, budget: Number(selected.relatedBudgetItem.budget) }
            : null,
        }
      : null,
  };
}

async function findOwn(officer: Officer, id: string) {
  const aspiration = await findAspirationForOfficer(id, desaOf(officer).id);
  if (!aspiration) throw new NotFoundError("Aspirasi tidak ditemukan.");
  return aspiration;
}

function log(officer: Officer, action: string, aspirationId: string, details?: Record<string, string | null>) {
  return logActivity({ userId: officer.id, action, entity: "Aspiration", entityId: aspirationId, details });
}

// Sort and route: set the category and who handles it.
export async function triage(officer: Officer, id: string, categoryId: string | null, forwardedTo: string | null) {
  const aspiration = await findOwn(officer, id);
  const categories = await findCategoriesForDesa(desaOf(officer).id);
  if (categoryId && !categories.some((category) => category.id === categoryId)) {
    throw new ValidationError("Kategori tidak dikenal.");
  }
  if (forwardedTo && !(FORWARD_TARGETS as readonly string[]).includes(forwardedTo)) {
    throw new ValidationError("Tujuan tidak dikenal.");
  }

  const status: AspirationStatus = forwardedTo && aspiration.status === "NEW" ? "FORWARDED" : aspiration.status;
  await updateAspiration(id, { categoryId, forwardedTo, status });
  await log(officer, "TRIAGE_ASPIRATION", id, { categoryId, forwardedTo });
}

export async function respond(officer: Officer, id: string, content: string, isPublic: boolean) {
  const aspiration = await findOwn(officer, id);
  if (aspiration.status === "REJECTED") throw new ValidationError("Aspirasi ini sudah ditandai tidak diproses.");

  await createResponse(id, officer.id, content, isPublic);
  // An internal note does not count as answering the resident.
  if (isPublic && aspiration.status !== "RESOLVED") await updateAspiration(id, { status: "RESPONDED" });
  await log(officer, isPublic ? "RESPOND_ASPIRATION" : "NOTE_ASPIRATION", id);
}

export async function setFinalStatus(officer: Officer, id: string, status: "RESOLVED" | "REJECTED") {
  await findOwn(officer, id);
  await updateAspiration(id, { status });
  await log(officer, status === "RESOLVED" ? "RESOLVE_ASPIRATION" : "REJECT_ASPIRATION", id);
}
