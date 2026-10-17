// Reusing the AI's understanding for a question that was already asked.
// Many residents ask the same thing (often by tapping an example question), and every
// AI call uses the shared quota. The numbers are still calculated fresh from the data.

import { createHash } from "node:crypto";

// Removes extra spaces but keeps the resident's capital letters (the panel shows the text).
// Capital letters are ignored when searching, in the database query.
export function normalizeQuestion(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

// A short fingerprint of the prompt. When the prompt changes (new rules, new examples,
// new dusun list), the fingerprint changes and old understandings are no longer reused.
export function intentVersion(systemPrompt: string): string {
  return createHash("sha256").update(systemPrompt).digest("hex").slice(0, 12);
}
