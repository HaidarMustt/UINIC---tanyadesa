// Connects the Q&A flow to a real AI provider.

import { z } from "zod";
import { createChatClient } from "@/lib/ai/chat-client";
import { toStrictJsonSchema } from "@/lib/ai/json-schema";
import type { AiProvider } from "../lib/ask";
import { IntentSchema } from "../lib/intent";

// The same zod schema validates the answer AND tells the AI what shape to return.
const INTENT_JSON_SCHEMA = toStrictJsonSchema(z.toJSONSchema(IntentSchema));

// AI rewording doubles token usage per question. It is off unless AI_REWRITE=true,
// because the template answer is already clear and always correct.
export function createQaAiProvider(): AiProvider {
  const client = createChatClient();
  const provider: AiProvider = {
    understandIntent: (systemPrompt, question) =>
      client.completeJson(systemPrompt, question, "question_intent", INTENT_JSON_SCHEMA),
  };
  if (process.env.AI_REWRITE === "true") {
    provider.rewrite = (prompt) => client.completeText(prompt);
  }
  return provider;
}
