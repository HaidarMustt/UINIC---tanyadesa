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
