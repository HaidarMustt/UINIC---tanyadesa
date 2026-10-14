import { z } from "zod";

// Desa slug in the URL: lowercase letters, numbers and dashes only, e.g. "sukamaju"
export const DesaSlugSchema = z
  .string()
  .regex(/^[a-z0-9-]{1,60}$/, "Slug desa hanya boleh huruf kecil, angka, dan tanda minus.");
