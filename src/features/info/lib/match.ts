// Finds the Info desa entries that answer a question. Pure function: no AI, no database.
// The AI only says which category and which keywords; this code picks the entries.

import type { InfoCategory } from "../constants";
import type { InfoEntry } from "../types";
import { isInfoActive } from "./active";

export const MAX_INFO_ANSWERS = 3;

export interface InfoQuery {
  category: InfoCategory | null;
  dusun: string | null;
  keywords: string[];
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

// Keywords found at the start of a word. A match in the title counts double.
function countMatches(text: string, keywords: string[]): number {
  const words = ` ${normalize(text)}`;
  return keywords.filter((keyword) => words.includes(` ${keyword}`)).length;
}

function score(entry: InfoEntry, keywords: string[], titleOnly: boolean): number {
  const inTitle = countMatches(entry.title, keywords) * 2;
  return titleOnly ? inTitle : inTitle + countMatches(entry.content, keywords);
}

// Only the best matches: "ktp" fits "Surat pengantar KTP" better than SKTM, which
// merely mentions KTP in its requirements. Equal scores (two posyandu) are all kept.
function best(pool: InfoEntry[], keywords: string[], titleOnly: boolean): InfoEntry[] {
  const scored = pool
    .map((entry) => ({ entry, points: score(entry, keywords, titleOnly) }))
    .filter((item) => item.points > 0);
  const top = Math.max(0, ...scored.map((item) => item.points));
  return scored.filter((item) => item.points === top).map((item) => item.entry);
}

export function matchInfos(entries: InfoEntry[], query: InfoQuery, now: Date = new Date()): InfoEntry[] {
  const keywords = query.keywords.map(normalize).filter((word) => word.length >= 2);
  const dusun = query.dusun?.toLowerCase() ?? null;

  let candidates = entries.filter((entry) => isInfoActive(entry.validUntil, now));
  // Another dusun's posyandu is not the answer; whole-village entries always fit.
  if (dusun) candidates = candidates.filter((entry) => entry.dusun === null || entry.dusun.toLowerCase() === dusun);

  const inCategory = query.category ? candidates.filter((entry) => entry.category === query.category) : candidates;

  if (keywords.length === 0) return inCategory.slice(0, MAX_INFO_ANSWERS);

  // Keywords decide. If nothing in the category matches, look at the TITLES in every
  // category, because the AI may pick a neighbouring one (jadwal vs pengumuman).
  // Titles only there: "kerja" must not find SKTM just because it says "hari kerja".
  const found = best(inCategory, keywords, false);
  const result = found.length > 0 ? found : best(candidates, keywords, true);
  return result.slice(0, MAX_INFO_ANSWERS);
}
