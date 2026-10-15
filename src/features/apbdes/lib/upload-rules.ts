// Checks on the uploaded file before we spend time parsing it.

// Server Actions accept 1 MB by default; an APBDes Excel file is usually far smaller.
export const MAX_UPLOAD_BYTES = 1024 * 1024;

export function checkUploadedFile(file: { name: string; size: number } | null): string | null {
  if (!file || file.size === 0) return "Pilih file Excel APBDes terlebih dahulu.";
  if (!/\.xlsx$/i.test(file.name)) return "File harus berformat Excel (.xlsx).";
  if (file.size > MAX_UPLOAD_BYTES) return "Ukuran file maksimal 1 MB.";
  return null;
}
