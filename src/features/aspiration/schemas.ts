import { z } from "zod";
import { MAX_ASPIRATION_LENGTH, MIN_ASPIRATION_LENGTH } from "./constants";

// Empty strings from the form become null, so the database stores "not filled" consistently.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

export const SubmitAspirationSchema = z.object({
  content: z
    .string()
    .trim()
    .min(MIN_ASPIRATION_LENGTH, "Ceritakan sedikit lebih lengkap, minimal 10 karakter.")
    .max(MAX_ASPIRATION_LENGTH, `Aspirasi maksimal ${MAX_ASPIRATION_LENGTH} karakter.`),
  dusun: optionalText(60),
  rt: optionalText(10),
  senderName: optionalText(80),
  contact: optionalText(100),
});

export type SubmitAspirationInput = z.infer<typeof SubmitAspirationSchema>;

export const TrackingCodeSchema = z.string().regex(/^[a-z2-9]{8}$/, "Kode lacak tidak valid.");
