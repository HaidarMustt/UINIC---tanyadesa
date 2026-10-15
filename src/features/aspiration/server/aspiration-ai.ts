// Connects aspiration categorizing to the AI provider configured in .env.

import { z } from "zod";
import { createChatClient } from "@/lib/ai/chat-client";
import { toStrictJsonSchema } from "@/lib/ai/json-schema";
import { buildCategorizationSchema, buildCategorizePrompt, type CategorizeContext } from "../lib/categorize";

export async function suggestCategory(content: string, context: CategorizeContext): Promise<unknown> {
  // The category list comes from the database, so the schema is built per desa.
  const jsonSchema = toStrictJsonSchema(z.toJSONSchema(buildCategorizationSchema(context.categories)));
  return createChatClient().completeJson(buildCategorizePrompt(context), content, "aspiration_category", jsonSchema);
}
