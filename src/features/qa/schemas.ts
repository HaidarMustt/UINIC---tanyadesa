import { z } from "zod";
import { MAX_QUESTION_LENGTH } from "./lib/ask";

export const AskQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3, "Pertanyaan terlalu pendek.")
    .max(MAX_QUESTION_LENGTH, `Pertanyaan maksimal ${MAX_QUESTION_LENGTH} karakter.`),
});
