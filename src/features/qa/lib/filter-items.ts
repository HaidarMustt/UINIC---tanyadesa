// Finds the budget rows that match an intent. Pure function: no AI, no database.

import { SECTOR_NAMES } from "@/features/apbdes/constants";
import type { ParsedBudgetItem } from "@/features/apbdes/types";
import type { Intent } from "./intent";

// Words that appear in almost every question and would match the wrong rows
// (e.g. "dana" matches "Dana Desa"). Removed even if the AI includes them.
const STOP_WORDS = new Set([
  "dana", "anggaran", "biaya", "uang", "desa", "berapa", "total", "jumlah", "apa", "saja",
  "ada", "untuk", "buat", "yang", "status", "selesai", "sudah", "belum", "kegiatan",
  "program", "tahun", "rp", "rupiah", "dusun", "rt",
  // Already covered by entryType; as keywords they match no row (found in the real-AI eval).
  "belanja", "pendapatan", "pengeluaran", "pemasukan",
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

// Keeps only meaningful keywords: drops stop words, dusun names, and words from the
// sector name when a sector is already chosen (e.g. "pembangunan" with sector 2).
export function cleanKeywords(
  keywords: string[],
  dusuns: string[],
  sectorCode: number | null = null,
): string[] {
  const dusunNames = new Set(dusuns.map(normalize));
  const sectorWords = new Set(
    sectorCode === null ? [] : normalize(SECTOR_NAMES[sectorCode] ?? "").split(" "),
  );
  return keywords
    .map(normalize)
    .filter(
      (word) =>
        word.length >= 2 &&
        !STOP_WORDS.has(word) &&
        !dusunNames.has(word) &&
        !sectorWords.has(word),
    );
}

// "03" matches "3"; a range "10-12" matches 10, 11 and 12.
function matchesRt(itemRt: string | null, askedRt: string): boolean {
  if (!itemRt) return false;
  const asked = Number(askedRt.replace(/\D/g, ""));
  const range = itemRt.match(/^(\d+)-(\d+)$/);
  if (range) return asked >= Number(range[1]) && asked <= Number(range[2]);
  return Number(itemRt.replace(/\D/g, "")) === asked;
}

// Matches the start of a word, so "jalan" matches "jalan" but not "pejalan".
function containsWord(description: string, keyword: string): boolean {
  return ` ${normalize(description)} `.includes(` ${keyword}`);
}

export function filterItems(
  items: ParsedBudgetItem[],
  intent: Intent,
  dusuns: string[],
): ParsedBudgetItem[] {
  const keywords = cleanKeywords(intent.keywords, dusuns, intent.sectorCode);

  return items.filter((item) => {
    if (intent.entryType && item.entryType !== intent.entryType) return false;
    if (intent.sectorCode && item.sectorCode !== intent.sectorCode) return false;
    if (intent.dusun && normalize(item.dusun ?? "") !== normalize(intent.dusun)) return false;
    if (intent.rt && !matchesRt(item.rt, intent.rt)) return false;
    if (intent.fundSource && item.fundSource !== intent.fundSource) return false;
    if (intent.status && item.status !== intent.status) return false;
    if (keywords.length > 0 && !keywords.some((word) => containsWord(item.description, word))) {
      return false;
    }
    return true;
  });
}
