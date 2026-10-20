import { z } from "zod";
import { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from "./constants";

export const AskQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(MIN_QUESTION_LENGTH, "Pertanyaan terlalu pendek.")
    .max(MAX_QUESTION_LENGTH, `Pertanyaan maksimal ${MAX_QUESTION_LENGTH} karakter.`),
  // The resident's previous question, so "kalau di Krajan?" can be understood.
  previousQuestion: z
    .string()
    .trim()
    .max(MAX_QUESTION_LENGTH)
    .nullish()
    .transform((value) => value || null),
});

// POST /api/v1/desa/{slug}/questions/{id}/feedback   body: { "helpful": true }
export const FeedbackSchema = z.object({ helpful: z.boolean() });
export const QuestionIdSchema = z.string().regex(/^[a-z0-9]{20,40}$/, "Id pertanyaan tidak valid.");
