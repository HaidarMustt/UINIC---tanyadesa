import * as XLSX from "xlsx";
import type {
  ActivityStatus,
  EntryType,
  FundSource,
  ParseResult,
  ParsedBudgetItem,
} from "../types";

type Cell = unknown;
type Row = Cell[];
type ColumnKey =
  | "code"
  | "type"
  | "sector"
  | "description"
  | "dusun"
  | "rt"
  | "source"
  | "budget"
  | "realized"
  | "status"
  | "note";

// Header text (lowercase, start of cell) -> column key
const HEADER_PREFIXES: Record<string, ColumnKey> = {
  "kode rekening": "code",
  jenis: "type",
  bidang: "sector",
  uraian: "description",
  dusun: "dusun",
  rt: "rt",
  "sumber dana": "source",
  anggaran: "budget",
  realisasi: "realized",
  status: "status",
  keterangan: "note",
};

const REQUIRED_COLUMNS: ColumnKey[] = ["code", "type", "description", "source", "budget"];

// "2.1.01", "4.2.1" -> yes. "BELANJA", "Total Belanja", null -> no.
const ACCOUNT_CODE_PATTERN = /^\d+(\.\d+)+$/;

// ---------------------------------------------------------------- main function

export function parseApbdesExcel(file: Buffer | ArrayBuffer): ParseResult {
  const rows = readFirstApbdesSheet(file);
  const headerIndex = findHeaderRow(rows);
  const columns = mapColumns(rows[headerIndex]);

  const items: ParsedBudgetItem[] = [];
  const warnings: string[] = [];
  const seenCodes = new Set<string>();

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const rowNumber = i + 1; // Excel rows start at 1
    const result = parseRow(rows[i], columns, rowNumber);
    if (result === null) continue; // not a budget row
    if (typeof result === "string") {
      warnings.push(result);
      continue;
    }

    if (seenCodes.has(result.accountCode)) {
      warnings.push(
        `Baris ${rowNumber}: kode rekening ${result.accountCode} muncul lebih dari sekali.`,
      );
    }
    if (result.realized > result.budget) {
      warnings.push(`Baris ${rowNumber} (${result.accountCode}): realisasi melebihi anggaran.`);
    }
    seenCodes.add(result.accountCode);
    items.push(result);
  }

  if (items.length === 0) warnings.push("Tidak ada baris anggaran yang terbaca.");
  return { items, warnings };
}

// ---------------------------------------------------------------- steps

function readFirstApbdesSheet(file: Buffer | ArrayBuffer): Row[] {
  const workbook = XLSX.read(file, { type: "buffer" });
  const sheetName =
    workbook.SheetNames.find((name) => /apbdes/i.test(name)) ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, raw: true, defval: null });
}

function findHeaderRow(rows: Row[]): number {
  const index = rows.findIndex((row) => row.some((cell) => /kode\s*rekening/i.test(toText(cell))));
  if (index < 0) {
    throw new Error('Kolom "Kode Rekening" tidak ditemukan. Pastikan file memakai format APBDes.');
  }
  return index;
}

function mapColumns(headerRow: Row): Partial<Record<ColumnKey, number>> {
  const columns: Partial<Record<ColumnKey, number>> = {};

  headerRow.forEach((cell, position) => {
    const text = toText(cell).toLowerCase();
    for (const [prefix, key] of Object.entries(HEADER_PREFIXES)) {
      if (text.startsWith(prefix) && columns[key] === undefined) columns[key] = position;
    }
  });

  const missing = REQUIRED_COLUMNS.filter((key) => columns[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(", ")}`);
  }
  return columns;
}

// Returns an item, a warning message, or null when the row is not a budget row.
function parseRow(
  row: Row,
  columns: Partial<Record<ColumnKey, number>>,
  rowNumber: number,
): ParsedBudgetItem | string | null {
  const cell = (key: ColumnKey) => (columns[key] === undefined ? null : row[columns[key]]);

  const accountCode = toText(cell("code"));
  if (!ACCOUNT_CODE_PATTERN.test(accountCode)) return null;

  const entryType = toEntryType(toText(cell("type")));
  if (!entryType) return `Baris ${rowNumber} (${accountCode}): kolom Jenis tidak dikenali.`;

  const budget = toRupiah(cell("budget"));
  if (budget === null || budget < 0) {
    return `Baris ${rowNumber} (${accountCode}): nilai anggaran tidak valid.`;
  }

  const sectorCode = entryType === "EXPENDITURE" ? toSectorCode(toText(cell("sector"))) : null;
  if (entryType === "EXPENDITURE" && sectorCode === null) {
    return `Baris ${rowNumber} (${accountCode}): bidang belanja tidak dikenali.`;
  }

  return {
    accountCode,
    entryType,
    sectorCode,
    description: toText(cell("description")),
    dusun: toDusun(toText(cell("dusun"))),
    rt: toRt(toText(cell("rt"))),
    fundSource: toFundSource(toText(cell("source"))),
    budget,
    realized: toRupiah(cell("realized")) ?? 0,
    status: toStatus(toText(cell("status")), entryType),
    note: toText(cell("note")) || null,
    sourceRow: rowNumber,
  };
}

// ---------------------------------------------------------------- converters

function toText(value: Cell): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

// Accepts numbers (185000000) and text ("Rp185.000.000").
function toRupiah(value: Cell): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  const digits = toText(value).replace(/rp/gi, "").replace(/[.\s]/g, "").replace(",", ".");
  if (digits === "" || digits === "-") return null;
  const number = Number(digits);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function toEntryType(text: string): EntryType | null {
  const t = text.toLowerCase();
  if (t.startsWith("pendapatan")) return "REVENUE";
  if (t.startsWith("belanja")) return "EXPENDITURE";
  if (t.includes("pembiayaan") && t.includes("penerimaan")) return "FINANCING_RECEIPT";
  if (t.includes("pembiayaan") && t.includes("pengeluaran")) return "FINANCING_EXPENDITURE";
  return null;
}

// "2. Pelaksanaan Pembangunan Desa" -> 2
function toSectorCode(text: string): number | null {
  const match = text.match(/^\s*([1-5])\b/);
  return match ? Number(match[1]) : null;
}

function toFundSource(text: string): FundSource {
  const t = text.toLowerCase();
  if (t === "dd" || t === "dana desa") return "DD";
  if (t === "add" || t.includes("alokasi dana desa")) return "ADD";
  if (t === "pades" || t.includes("asli desa")) return "PADES";
  if (t === "bhp" || t.includes("bagi hasil")) return "BHP";
  if (t.includes("kabupaten")) return "BANKEU_KAB";
  if (t.includes("provinsi")) return "BANKEU_PROV";
  if (t.includes("silpa")) return "SILPA";
  return "OTHER";
}

function toStatus(text: string, entryType: EntryType): ActivityStatus {
  const t = text.toLowerCase();
  if (t.includes("belum")) return "NOT_STARTED";
  if (t.includes("selesai")) return "COMPLETED";
  if (t.includes("sebagian")) return "PARTIALLY_RECEIVED";
  if (t.includes("diterima")) return "RECEIVED";
  if (t.includes("berjalan")) return "IN_PROGRESS";
  return entryType === "EXPENDITURE" ? "IN_PROGRESS" : "PARTIALLY_RECEIVED";
}

// "Seluruh desa" or "-" -> null, "Dusun Krajan" -> "Krajan"
function toDusun(text: string): string | null {
  if (!text || text === "-" || /seluruh/i.test(text)) return null;
  return text.replace(/^dusun\s+/i, "");
}

// "-" -> null, "RT 03" -> "03", "10-12" stays "10-12"
function toRt(text: string): string | null {
  if (!text || text === "-") return null;
  return text.replace(/^rt\s*/i, "").replace(/\s+/g, "");
}
