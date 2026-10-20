import type { InfoCategory } from "./constants";

// One published Info desa entry, as the Q&A feature sees it.
export interface InfoEntry {
  category: InfoCategory;
  title: string;
  content: string;
  dusun: string | null; // null = whole village
  validUntil: Date | null;
  updatedAt: Date;
}
