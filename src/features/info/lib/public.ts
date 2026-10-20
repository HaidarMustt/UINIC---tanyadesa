// The shape of Info desa in the open API: only published, still-valid entries,
// with a readable category name. Pure function, so it is easy to test.

import { INFO_CATEGORY_LABELS, type InfoCategory } from "../constants";
import type { InfoEntry } from "../types";
import { isInfoActive } from "./active";

export interface PublicInfo {
  category: InfoCategory;
  categoryName: string;
  title: string;
  content: string;
  dusun: string | null;
  validUntil: Date | null;
  updatedAt: Date;
}

export function toPublicInfos(entries: InfoEntry[], category: InfoCategory | null, now: Date = new Date()): PublicInfo[] {
  return entries
    .filter((entry) => isInfoActive(entry.validUntil, now))
    .filter((entry) => category === null || entry.category === category)
    .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))
    .map((entry) => ({ ...entry, categoryName: INFO_CATEGORY_LABELS[entry.category] }));
}
