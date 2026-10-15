import { z } from "zod";

// Desa slug in the URL: lowercase letters, numbers and dashes only, e.g. "sukamaju"
export const DesaSlugSchema = z
  .string()
  .regex(/^[a-z0-9-]{1,60}$/, "Slug desa hanya boleh huruf kecil, angka, dan tanda minus.");

// Query string for GET /api/v1/desa/{slug}/apbdes
// e.g. ?entryType=EXPENDITURE&sector=2&dusun=Ngemplak&format=csv
export const ItemsQuerySchema = z.object({
  entryType: z
    .enum(["REVENUE", "EXPENDITURE", "FINANCING_RECEIPT", "FINANCING_EXPENDITURE"])
    .optional(),
  sector: z.coerce.number().int().min(1).max(5).optional(),
  dusun: z.string().trim().min(1).max(60).optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export type ItemsQuery = z.infer<typeof ItemsQuerySchema>;

// The text fields of the upload form in the panel. The file is checked separately.
export const UploadFormSchema = z.object({
  fiscalYear: z.coerce.number().int().min(2015, "Tahun anggaran tidak valid.").max(2100, "Tahun anggaran tidak valid."),
  realizedAsOf: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : new Date(`${value}T00:00:00+07:00`)))
    .refine((date) => date === null || !Number.isNaN(date.getTime()), "Tanggal realisasi tidak valid."),
});
