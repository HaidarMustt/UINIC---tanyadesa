import { z } from "zod";
import { INFO_CATEGORIES, MAX_INFO_CONTENT_LENGTH, MAX_INFO_TITLE_LENGTH } from "./constants";

// Empty form fields become null.
const emptyToNull = (value: unknown) => (value === "" || value === undefined ? null : value);

// The add/edit form in the panel. An empty id means "new entry".
export const InfoFormSchema = z.object({
  id: z.preprocess(emptyToNull, z.string().min(1).max(40).nullable()),
  category: z.enum(INFO_CATEGORIES, { message: "Pilih kategori." }),
  title: z
    .string()
    .trim()
    .min(3, "Judul minimal 3 karakter.")
    .max(MAX_INFO_TITLE_LENGTH, `Judul maksimal ${MAX_INFO_TITLE_LENGTH} karakter.`),
  content: z
    .string()
    .trim()
    .min(10, "Isi minimal 10 karakter.")
    .max(MAX_INFO_CONTENT_LENGTH, `Isi maksimal ${MAX_INFO_CONTENT_LENGTH} karakter.`),
  dusunId: z.preprocess(emptyToNull, z.string().min(1).max(40).nullable()),
  // "2026-11-01" from <input type="date"> = midnight WIB of that day (the last day shown).
  validUntil: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.")
      .transform((value) => new Date(`${value}T00:00:00+07:00`))
      .refine((date) => !Number.isNaN(date.getTime()), "Tanggal tidak valid.")
      .nullable(),
  ),
});

export type InfoFormInput = z.infer<typeof InfoFormSchema>;
