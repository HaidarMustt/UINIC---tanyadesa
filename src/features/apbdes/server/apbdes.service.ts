// Business flow for APBDes: parse the file, check it, save it, publish it.
// The service never reads HTTP requests and never writes Prisma queries itself.

import { NotFoundError, ValidationError } from "@/lib/errors";
import { FUND_SOURCE_NAMES, SECTOR_NAMES } from "../constants";
import { checkBalance, type BalanceResult } from "../lib/check-balance";
import { parseApbdesExcel } from "../lib/parse-excel";
import { summarize, type GroupTotal } from "../lib/summarize";
import type { ItemsQuery } from "../schemas";
import type { FundSource, ParsedBudgetItem } from "../types";
import {
  createDocumentWithItems,
  findDesasWithPublishedDocuments,
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
  if (!desa) throw new NotFoundError(`Desa dengan slug "${input.desaSlug}" tidak ditemukan.`);

  // The parser explains problems in plain Indonesian (e.g. a missing column),
  // so its messages are safe to show to the operator.
  let parsed;
  try {
    parsed = parseApbdesExcel(input.file);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "format tidak dikenali";
    throw new ValidationError(`File tidak bisa dibaca: ${reason}`);
  }
  const { items, warnings } = parsed;
  if (items.length === 0) throw new ValidationError("File tidak berisi baris anggaran yang bisa dibaca.");

  // The database allows each account code once per document, so stop here with a clear message.
  const codes = items.map((item) => item.accountCode);
  const duplicates = [...new Set(codes.filter((code, index) => codes.indexOf(code) !== index))];
  if (duplicates.length > 0) {
    throw new ValidationError(`Kode rekening dobel: ${duplicates.join(", ")}. Perbaiki di Excel lalu unggah ulang.`);
  }

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

// ---------------------------------------------------------------- public summary

type LabeledGroup = GroupTotal & { label: string };

type PublishedDocument = NonNullable<Awaited<ReturnType<typeof findPublishedDocument>>>;

interface DocumentInfo {
  desa: { slug: string; name: string; isSimulation: boolean };
  document: {
    title: string;
    fiscalYear: number;
    version: number;
    realizedAsOf: Date | null;
    publishedAt: Date | null;
  };
}

// Database rows -> the same shape the pure functions already understand.
// BigInt becomes number here, because JSON cannot carry BigInt.
function toPlainItems(rows: PublishedDocument["items"]): ParsedBudgetItem[] {
  return rows.map((item) => ({
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
}

function describeDocument(document: PublishedDocument): DocumentInfo {
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
  };
}

export interface PublishedSummary extends DocumentInfo {
  balance: BalanceResult;
  bySector: LabeledGroup[];
  byDusun: LabeledGroup[];
  byFundSource: LabeledGroup[];
}

// Returns null when the desa has no published APBDes yet.
export async function getPublishedSummary(desaSlug: string): Promise<PublishedSummary | null> {
  const document = await findPublishedDocument(desaSlug);
  if (!document) return null;

  const items = toPlainItems(document.items);
  const summary = summarize(items);

  return {
    ...describeDocument(document),
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

// ---------------------------------------------------------------- open data

export async function listOpenDesa() {
  const rows = await findDesasWithPublishedDocuments();
  return rows.map(({ documents, ...desa }) => ({
    ...desa,
    fiscalYears: documents.map((document) => document.fiscalYear),
  }));
}

export interface PublicBudgetItem {
  accountCode: string;
  entryType: ParsedBudgetItem["entryType"];
  sectorCode: number | null;
  sectorName: string | null;
  description: string;
  dusun: string | null;
  rt: string | null;
  fundSource: FundSource;
  fundSourceName: string;
  budget: number;
  realized: number;
  realizationRate: number;
  status: ParsedBudgetItem["status"];
  note: string | null;
}

export interface PublishedItems extends DocumentInfo {
  count: number;
  items: PublicBudgetItem[];
}

function matchesFilter(item: ParsedBudgetItem, query: ItemsQuery): boolean {
  if (query.entryType && item.entryType !== query.entryType) return false;
  if (query.sector && item.sectorCode !== query.sector) return false;
  if (query.dusun && item.dusun?.toLowerCase() !== query.dusun.toLowerCase()) return false;
  return true;
}

function toPublicItem(item: ParsedBudgetItem): PublicBudgetItem {
  return {
    accountCode: item.accountCode,
    entryType: item.entryType,
    sectorCode: item.sectorCode,
    sectorName: item.sectorCode === null ? null : (SECTOR_NAMES[item.sectorCode] ?? null),
    description: item.description,
    dusun: item.dusun,
    rt: item.rt,
    fundSource: item.fundSource,
    fundSourceName: FUND_SOURCE_NAMES[item.fundSource],
    budget: item.budget,
    realized: item.realized,
    realizationRate: item.budget === 0 ? 0 : item.realized / item.budget,
    status: item.status,
    note: item.note,
  };
}

// Returns null when the desa has no published APBDes yet.
export async function getPublishedItems(
  desaSlug: string,
  query: ItemsQuery,
): Promise<PublishedItems | null> {
  const document = await findPublishedDocument(desaSlug);
  if (!document) return null;

  const items = toPlainItems(document.items)
    .filter((item) => matchesFilter(item, query))
    .map(toPublicItem);

  return { ...describeDocument(document), count: items.length, items };
}

// ---------------------------------------------------------------- dataset for other features

export interface PublishedDataset {
  desaId: string;
  desaName: string;
  isSimulation: boolean;
  documentId: string;
  fiscalYear: number;
  dusuns: string[];
  items: ParsedBudgetItem[];
  itemIdByAccountCode: Map<string, string>;
}

// Everything the Q&A feature needs about a desa's published APBDes.
export async function getPublishedDataset(desaSlug: string): Promise<PublishedDataset | null> {
  const document = await findPublishedDocument(desaSlug);
  if (!document) return null;

  return {
    desaId: document.desaId,
    desaName: document.desa.name,
    isSimulation: document.desa.isSimulation,
    documentId: document.id,
    fiscalYear: document.fiscalYear,
    dusuns: document.desa.dusuns.map((dusun) => dusun.name),
    items: toPlainItems(document.items),
    itemIdByAccountCode: new Map(document.items.map((item) => [item.accountCode, item.id])),
  };
}
