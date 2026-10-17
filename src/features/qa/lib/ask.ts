// The full Q&A flow:
//   question -> [AI] intent -> [code] calculate -> [code] template -> answer
//                                              \-> [AI] rewrite -> number guard -> answer
//
// The AI provider is an interface, so it can be swapped (Groq, Gemini, OpenAI, ...)
// and replaced by a fake one in tests.

import type { ParsedBudgetItem } from "@/features/apbdes/types";
import { MAX_QUESTION_LENGTH } from "../constants";
import { calculate } from "./calculate";
import {
  buildRewritePrompt,
  composeTemplate,
  fillPlaceholders,
  placeholderValues,
  type Answer,
} from "./compose-answer";
import { buildIntentPrompt, IntentSchema, type DesaContext, type Intent } from "./intent";

export interface AiProvider {
  // Returns raw JSON that should match IntentSchema.
  understandIntent(systemPrompt: string, question: string): Promise<unknown>;
  // Optional: rewrites the template answer more naturally.
  rewrite?(prompt: string): Promise<string>;
}

export interface AskResult extends Answer {
  intent: Intent | null;
  usedAiWording: boolean; // true = the sentence was written by the AI and passed the guard
}


export async function ask(
  question: string,
  items: ParsedBudgetItem[],
  context: DesaContext,
  ai: AiProvider,
): Promise<AskResult> {
  const text = question.trim().slice(0, MAX_QUESTION_LENGTH);
  if (text.length < 3) {
    return { status: "REFUSED", text: "Pertanyaannya terlalu pendek. Coba tulis lebih lengkap.", sources: [], intent: null, usedAiWording: false };
  }

  // 1. Understand the question (AI), then validate the shape (zod).
  const raw = await ai.understandIntent(buildIntentPrompt(context), text);
  const parsed = IntentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "REFUSED",
      text: "Maaf, pertanyaannya belum bisa dipahami. Coba sebutkan kegiatan, dusun, atau sumber dananya.",
      sources: [],
      intent: null,
      usedAiWording: false,
    };
  }
  const intent = parsed.data;

  // 2. Calculate (code).
  const facts = calculate(intent, items, context.dusuns);
  const template = composeTemplate(facts, context.desaName);

  // 3. Optional AI wording, protected by the number guard.
  // Explanations are written by people and are never reworded.
  if (ai.rewrite && facts.status === "ANSWERED" && facts.type !== "EXPLAIN") {
    try {
      const draft = await ai.rewrite(buildRewritePrompt(text, facts));
      const filled = fillPlaceholders(draft, placeholderValues(facts));
      if (filled) return { ...template, text: filled, intent, usedAiWording: true };
    } catch {
      // AI unavailable: fall back to the template
    }
  }
  return { ...template, intent, usedAiWording: false };
}
