// Q&A flow with the database: check limits, ask, save the question and its sources.

import { getPublishedDataset } from "@/features/apbdes/server/apbdes.service";
import { findPublishedInfos } from "@/features/info/server/info.repository";
import { NotFoundError, RateLimitError, ServiceUnavailableError } from "@/lib/errors";
import { ask, type AiProvider } from "../lib/ask";
import { buildIntentPrompt, IntentSchema } from "../lib/intent";
import { intentVersion, normalizeQuestion } from "../lib/intent-cache";
import type { QuestionAnswer } from "../types";
import { checkQuestionLimits } from "../lib/rate-limit";
import { createQaAiProvider } from "./qa-ai";
import { countDesaQuestionsSince, countSessionQuestionsSince, findCachedIntent, saveQuestion } from "./qa.repository";

const ONE_HOUR_MS = 60 * 60 * 1000;

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export type { QuestionAnswer };

export async function askQuestion(
  desaSlug: string,
  question: string,
  sessionId: string,
): Promise<QuestionAnswer> {
  const dataset = await getPublishedDataset(desaSlug);
  if (!dataset) throw new NotFoundError("APBDes untuk desa ini belum tersedia.");

  const [sessionCount, desaCount] = await Promise.all([
    countSessionQuestionsSince(sessionId, new Date(Date.now() - ONE_HOUR_MS)),
    countDesaQuestionsSince(dataset.desaId, startOfToday()),
  ]);
  const limit = checkQuestionLimits(sessionCount, desaCount);
  if (!limit.allowed) throw new RateLimitError(limit.message);

  const context = { desaName: dataset.desaName, fiscalYear: dataset.fiscalYear, dusuns: dataset.dusuns };
  const normalized = normalizeQuestion(question);
  const version = intentVersion(buildIntentPrompt(context));
  // Stored without extra spaces so the same question is found again next time.
  const base = { desaId: dataset.desaId, documentId: dataset.documentId, sessionId, text: normalized, intentVersion: version };
  const startedAt = Date.now();

  // Asked before with the same prompt? Reuse that understanding instead of calling the AI.
  const realAi = createQaAiProvider();
  const ai: AiProvider = {
    ...realAi,
    async understandIntent(systemPrompt, text) {
      const cached = IntentSchema.safeParse(await findCachedIntent(dataset.documentId, version, normalized));
      return cached.success ? cached.data : realAi.understandIntent(systemPrompt, text);
    },
  };

  // Read before the AI call, so a database problem is not reported as an AI problem.
  const infos = await findPublishedInfos(dataset.desaId);

  let result;
  try {
    result = await ask(question, dataset.items, context, ai, infos);
  } catch (error) {
    // Record the failure so we can see AI problems later, then tell the resident kindly.
    await saveQuestion({ ...base, intent: null, answer: null, status: "ERROR", durationMs: Date.now() - startedAt, budgetItemIds: [] });
    console.error("[qa] AI failed", error);
    throw new ServiceUnavailableError("Layanan tanya jawab sedang sibuk. Coba lagi beberapa saat lagi.");
  }

  const budgetItemIds = result.sources
    .map((source) => dataset.itemIdByAccountCode.get(source.accountCode))
    .filter((id): id is string => id !== undefined);

  const saved = await saveQuestion({
    ...base,
    intent: result.intent,
    answer: result.text,
    status: result.status,
    durationMs: Date.now() - startedAt,
    budgetItemIds,
  });

  return {
    id: saved.id,
    status: result.status,
    kind: result.kind,
    answer: result.text,
    sources: result.sources,
    isSimulation: dataset.isSimulation,
  };
}
