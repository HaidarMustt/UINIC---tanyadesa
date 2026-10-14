// Business flow for APBDes: parse the file, check it, save it, publish it.
// The service never reads HTTP requests and never writes Prisma queries itself.

import { FUND_SOURCE_NAMES, SECTOR_NAMES } from "../constants";
import { checkBalance, type BalanceResult } from "../lib/check-balance";
import { parseApbdesExcel } from "../lib/parse-excel";
import { summarize, type GroupTotal } from "../lib/summarize";
import type { FundSource, ParsedBudgetItem } from "../types";
import {
  createDocumentWithItems,
  findDesaWithDusunsBySlug,
  findPublishedDocument,
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
    warnings.push(
      `Anggaran tidak seimbang: selisih Rp${balance.difference.toLocaleString("id-ID")}.`,
    );
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

// ---------------------------------------------------------------- public summary

type LabeledGroup = GroupTotal & { label: string };

export interface PublishedSummary {
  desa: { slug: string; name: string; isSimulation: boolean };
  document: {
    title: string;
    fiscalYear: number;
    version: number;
    realizedAsOf: Date | null;
    publishedAt: Date | null;
  };
  balance: BalanceResult;
  bySector: LabeledGroup[];
  byDusun: LabeledGroup[];
  byFundSource: LabeledGroup[];
}

// Returns null when the desa has no published APBDes yet.
export async function getPublishedSummary(desaSlug: string): Promise<PublishedSummary | null> {
  const document = await findPublishedDocument(desaSlug);
  if (!document) return null;

  // Database rows -> the same shape the pure functions already understand.
  // BigInt becomes number here, because JSON cannot carry BigInt.
  const items: ParsedBudgetItem[] = document.items.map((item) => ({
    accountCode: item.accountCode,
    entryType: item.entryType,
    sectorCode: item.sectorCode,
    description: item.description,
    dusun: item.dusun?.name ?? null,
    rt: item.rt,
    fundSource: item.fundSource,
    budget: Number(item.budget),
    realized: Number(item.realized),
    status: item.status,
    note: item.note,
    sourceRow: item.sourceRow ?? 0,
  }));

  const summary = summarize(items);

  return {
    desa: {
      slug: document.desa.slug,
      name: document.desa.name,
      isSimulation: document.desa.isSimulation,
    },
    document: {
      title: document.title,
      fiscalYear: document.fiscalYear,
      version: document.version,
      realizedAsOf: document.realizedAsOf,
      publishedAt: document.publishedAt,
    },
    balance: checkBalance(items),
    bySector: summary.bySector.map((group) => ({
      ...group,
      label: SECTOR_NAMES[Number(group.key)] ?? `Bidang ${group.key}`,
    })),
    byDusun: summary.byDusun.map((group) => ({ ...group, label: group.key })),
    byFundSource: summary.byFundSource.map((group) => ({
      ...group,
      label: FUND_SOURCE_NAMES[group.key as FundSource] ?? group.key,
    })),
  };
}
