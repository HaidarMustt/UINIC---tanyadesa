// What operators do in the panel: upload a draft, review it, publish or discard it.
// Every function receives the logged-in user and checks the document belongs to their desa.

import { findLatestActivity, logActivity } from "@/lib/activity-log";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { BalanceResult } from "../lib/check-balance";
import {
  deleteDocument,
  findDocumentForDesa,
  findDocumentsForDesa,
  publishDocument,
} from "./apbdes.repository";
import { importApbdes } from "./apbdes.service";

export interface PanelUser {
  id: string;
  desa: { id: string; slug: string } | null;
}

export interface UploadInput {
  fiscalYear: number;
  title: string;
  realizedAsOf: Date | null;
  fileName: string;
  file: Buffer;
}

function requireDesa(user: PanelUser) {
  if (!user.desa) throw new ValidationError("Akun ini tidak terhubung ke desa mana pun.");
  return user.desa;
}

export async function uploadDraft(user: PanelUser, input: UploadInput) {
  const desa = requireDesa(user);
  const result = await importApbdes({
    desaSlug: desa.slug,
    fiscalYear: input.fiscalYear,
    title: input.title,
    realizedAsOf: input.realizedAsOf,
    fileName: input.fileName,
    fileUrl: `upload://${input.fileName}`, // the file itself is not stored yet (roadmap: Supabase Storage)
    file: input.file,
    uploaderId: user.id,
  });

  // The warnings are kept in the audit log, so the review screen can show them after a reload.
  await logActivity({
    userId: user.id,
    action: "UPLOAD_DOCUMENT",
    entity: "ApbdesDocument",
    entityId: result.documentId,
    details: { warnings: result.warnings, balance: { ...result.balance } },
  });
  return result;
}

export interface DraftReview {
  id: string;
  title: string;
  fiscalYear: number;
  version: number;
  fileName: string;
  itemCount: number;
  warnings: string[];
  balance: BalanceResult | null;
}

export async function getPanelDocuments(user: PanelUser) {
  const desa = requireDesa(user);
  const documents = await findDocumentsForDesa(desa.id);

  const draft = documents.find((document) => document.status === "IN_REVIEW") ?? null;
  let review: DraftReview | null = null;
  if (draft) {
    const log = await findLatestActivity("ApbdesDocument", draft.id, "UPLOAD_DOCUMENT");
    const details = (log?.details ?? {}) as { warnings?: string[]; balance?: BalanceResult };
    review = {
      id: draft.id,
      title: draft.title,
      fiscalYear: draft.fiscalYear,
      version: draft.version,
      fileName: draft.fileName,
      itemCount: draft._count.items,
      warnings: details.warnings ?? [],
      balance: details.balance ?? null,
    };
  }

  return { documents, review };
}

async function findOwnDraft(user: PanelUser, documentId: string) {
  const desa = requireDesa(user);
  const document = await findDocumentForDesa(documentId, desa.id);
  if (!document) throw new NotFoundError("Dokumen tidak ditemukan.");
  if (document.status !== "IN_REVIEW") {
    throw new ValidationError("Hanya dokumen yang sedang ditinjau yang bisa diterbitkan atau dibatalkan.");
  }
  return document;
}

export async function publishDraft(user: PanelUser, documentId: string) {
  const document = await findOwnDraft(user, documentId);
  await publishDocument(document.id, user.id);
  await logActivity({
    userId: user.id,
    action: "PUBLISH_DOCUMENT",
    entity: "ApbdesDocument",
    entityId: document.id,
    details: { fiscalYear: document.fiscalYear, version: document.version },
  });
}

export async function discardDraft(user: PanelUser, documentId: string) {
  const document = await findOwnDraft(user, documentId);
  await deleteDocument(document.id);
  await logActivity({
    userId: user.id,
    action: "DISCARD_DOCUMENT",
    entity: "ApbdesDocument",
    entityId: document.id,
    details: { fileName: document.fileName, version: document.version },
  });
}
