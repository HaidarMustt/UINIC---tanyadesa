// An entry is shown until the end of its "berlaku sampai" day (WIB).
// Entries without that date (office hours, requirements, contacts) never expire.

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

// "2026-10-20" for the WIB calendar day of a moment.
function wibDay(date: Date): string {
  return new Date(date.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

export function isInfoActive(validUntil: Date | null, now: Date = new Date()): boolean {
  if (validUntil === null) return true;
  return wibDay(validUntil) >= wibDay(now);
}
