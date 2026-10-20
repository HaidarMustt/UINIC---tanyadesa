// Database access for the Q&A feature.

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { Intent } from "../lib/intent";

export function countSessionQuestionsSince(sessionId: string, since: Date) {
  return db.question.count({ where: { sessionId, createdAt: { gte: since } } });
}

export function countDesaQuestionsSince(desaId: string, since: Date) {
  return db.question.count({ where: { desaId, createdAt: { gte: since } } });
}

export interface NewQuestion {
  desaId: string;
  documentId: string;
  sessionId: string;
  text: string;
  intent: Intent | null;
  intentVersion: string | null;
  answer: string | null;
  status: "ANSWERED" | "NOT_FOUND" | "REFUSED" | "ERROR";
  durationMs: number;
  budgetItemIds: string[];
}

// Saves the question together with the budget rows its answer was based on.
export function saveQuestion(question: NewQuestion) {
  return db.question.create({
    data: {
      desaId: question.desaId,
      documentId: question.documentId,
      sessionId: question.sessionId,
      text: question.text,
      intent: question.intent ?? Prisma.JsonNull,
      intentVersion: question.intentVersion,
      answer: question.answer,
      status: question.status,
      durationMs: question.durationMs,
      sources: { create: question.budgetItemIds.map((budgetItemId) => ({ budgetItemId })) },
    },
    select: { id: true },
  });
}

// The latest understanding of the same question, for the same document and prompt version.
// Questions are stored as typed; "mode: insensitive" ignores capital letters.
export async function findCachedIntent(documentId: string, intentVersion: string, normalizedText: string) {
  const found = await db.question.findFirst({
    where: {
      documentId,
      intentVersion,
      text: { equals: normalizedText, mode: "insensitive" },
      status: { not: "ERROR" },
      NOT: { intent: { equals: Prisma.AnyNull } },
    },
    orderBy: { createdAt: "desc" },
    select: { intent: true },
  });
  return found?.intent ?? null;
}

// A resident rates an answer. Only the browser that asked the question may rate it,
// so nobody can change other people's ratings by guessing ids.
export async function setQuestionFeedback(id: string, sessionId: string, isHelpful: boolean): Promise<boolean> {
  const updated = await db.question.updateMany({ where: { id, sessionId }, data: { isHelpful } });
  return updated.count > 0;
}
