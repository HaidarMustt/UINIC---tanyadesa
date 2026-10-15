// Shared by the server and the browser form. No server-only imports here.

export const MIN_ASPIRATION_LENGTH = 10;
export const MAX_ASPIRATION_LENGTH = 1000;

// What residents see for each status.
export const STATUS_FOR_RESIDENTS = {
  NEW: "Diterima",
  FORWARDED: "Diteruskan",
  RESPONDED: "Ditanggapi",
  RESOLVED: "Selesai",
  REJECTED: "Tidak diproses",
} as const;
