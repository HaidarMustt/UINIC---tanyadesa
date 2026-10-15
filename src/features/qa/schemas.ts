import { z } from "zod";
import { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from "./constants";

export const AskQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(MIN_QUESTION_LENGTH, "Pertanyaan terlalu pendek.")
    .max(MAX_QUESTION_LENGTH, `Pertanyaan maksimal ${MAX_QUESTION_LENGTH} karakter.`),
});
