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

// Who an officer can forward an aspiration to (village structure per Permendagri 84/2015, plus BPD).
export const FORWARD_TARGETS = [
  "Kepala Desa",
  "Sekretaris Desa",
  "Kaur Keuangan",
  "Kaur Perencanaan",
  "Kaur Tata Usaha dan Umum",
  "Kasi Pemerintahan",
  "Kasi Kesejahteraan",
  "Kasi Pelayanan",
  "BPD",
] as const;

// AI warnings shown to officers. A flag never hides or deletes anything by itself.
export const AI_FLAGS = ["SPAM", "KASAR", "ANCAMAN"] as const;
export type AiFlag = (typeof AI_FLAGS)[number];

export const FLAG_LABELS: Record<AiFlag, string> = {
  SPAM: "Mungkin spam atau iklan",
  KASAR: "Mengandung kata kasar",
  ANCAMAN: "Mengandung ancaman",
};

export const STATUS_FOR_OFFICERS = {
  NEW: "Baru",
  FORWARDED: "Diteruskan",
  RESPONDED: "Ditanggapi",
  RESOLVED: "Selesai",
  REJECTED: "Tidak diproses",
} as const;
