// Short names fit on a phone; the full official name is kept for screen readers.
export const SECTOR_SHORT_NAMES: Record<string, string> = {
  "1": "Pemerintahan",
  "2": "Pembangunan",
  "3": "Kemasyarakatan",
  "4": "Pemberdayaan",
  "5": "Bencana & darurat",
};

export function sectorColor(key: string): string {
  return `var(--sector-${key}, var(--muted))`;
}
