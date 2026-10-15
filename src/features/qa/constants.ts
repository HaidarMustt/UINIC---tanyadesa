// Shared by the server (validation) and the browser (form limits).
// Keep this file free of server-only imports, so client components can use it.

export const MIN_QUESTION_LENGTH = 3;
export const MAX_QUESTION_LENGTH = 500;

// Shown as one-tap examples on the Tanya page.
export const EXAMPLE_QUESTIONS = [
  "Dana jalan RT 3 berapa?",
  "Berapa total belanja Dusun Ngemplak?",
  "Anggaran bidang pembangunan berapa?",
  "Kegiatan apa saja yang belum dimulai?",
];
