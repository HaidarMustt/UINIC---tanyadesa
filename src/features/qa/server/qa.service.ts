// Q&A flow with the database: check limits, ask, save the question and its sources.

import { getPublishedDataset } from "@/features/apbdes/server/apbdes.service";
import { NotFoundError, RateLimitError, ServiceUnavailableError } from "@/lib/errors";
import { ask } from "../lib/ask";
import { checkQuestionLimits } from "../lib/rate-limit";
import { createQaAiProvider } from "./qa-ai";
import { countDesaQuestionsSince, countSessionQuestionsSince, saveQuestion } from "./qa.repository";

const ONE_HOUR_MS = 60 * 60 * 1000;

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export interface QuestionAnswer {
  id: string;
  status: "ANSWERED" | "NOT_FOUND" | "REFUSED";
  answer: string;
  sources: { accountCode: string; description: string }[];
  isSimulation: boolean;
}

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
  const base = { desaId: dataset.desaId, documentId: dataset.documentId, sessionId, text: question };
  const startedAt = Date.now();

  let result;
  try {
    result = await ask(question, dataset.items, context, createQaAiProvider());
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
    answer: result.text,
    sources: result.sources,
    isSimulation: dataset.isSimulation,
  };
}
