// Business flow for APBDes: parse the file, check it, save it, publish it.
// The service never reads HTTP requests and never writes Prisma queries itself.

import { checkBalance, type BalanceResult } from "../lib/check-balance";
import { parseApbdesExcel } from "../lib/parse-excel";
import {
  createDocumentWithItems,
  findDesaWithDusunsBySlug,
  getNextDocumentVersion,
  publishDocument,
  type NewBudgetItem,
} from "./apbdes.repository";

export interface ImportApbdesInput {
  desaSlug: string;
  fiscalYear: number;
  title: string;
  realizedAsOf: Date | null;
  fileName: string;
  fileUrl: string;
  file: Buffer;
  uploaderId: string;
}

export interface ImportApbdesResult {
  documentId: string;
  version: number;
  itemCount: number;
  warnings: string[];
  balance: BalanceResult;
}

export async function importApbdes(input: ImportApbdesInput): Promise<ImportApbdesResult> {
  const desa = await findDesaWithDusunsBySlug(input.desaSlug);
  if (!desa) throw new Error(`Desa dengan slug "${input.desaSlug}" tidak ditemukan.`);

  const { items, warnings } = parseApbdesExcel(input.file);
  if (items.length === 0) throw new Error("File tidak berisi baris anggaran yang bisa dibaca.");

  // Turn dusun names from the Excel file into database ids.
  const dusunIdByName = new Map(desa.dusuns.map((dusun) => [dusun.name.toLowerCase(), dusun.id]));
  const newItems: NewBudgetItem[] = items.map(({ dusun, ...item }) => {
    if (dusun === null) return { ...item, dusunId: null };

    const dusunId = dusunIdByName.get(dusun.toLowerCase());
    if (!dusunId) {
      warnings.push(`Baris ${item.sourceRow}: dusun "${dusun}" tidak terdaftar di desa ini.`);
    }
    return { ...item, dusunId: dusunId ?? null };
  });

  const balance = checkBalance(items);
  if (!balance.isBalanced) {
    warnings.push(`Anggaran tidak seimbang: selisih Rp${balance.difference.toLocaleString("id-ID")}.`);
  }

  const version = await getNextDocumentVersion(desa.id, input.fiscalYear);
  const document = await createDocumentWithItems(
    {
      desaId: desa.id,
      fiscalYear: input.fiscalYear,
      version,
      title: input.title,
      realizedAsOf: input.realizedAsOf,
      fileName: input.fileName,
      fileUrl: input.fileUrl,
      uploaderId: input.uploaderId,
    },
    newItems,
  );

  return { documentId: document.id, version, itemCount: newItems.length, warnings, balance };
}

export function publishApbdes(documentId: string, publisherId: string) {
  return publishDocument(documentId, publisherId);
}