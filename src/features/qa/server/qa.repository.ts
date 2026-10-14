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
      answer: question.answer,
      status: question.status,
      durationMs: question.durationMs,
      sources: { create: question.budgetItemIds.map((budgetItemId) => ({ budgetItemId })) },
    },
    select: { id: true },
  });
}
