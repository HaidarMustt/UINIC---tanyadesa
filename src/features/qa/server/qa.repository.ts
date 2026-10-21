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

// ---------------------------------------------------------------- panel: Pertanyaan warga
// Officers see the question texts and statuses, never the anonymous session id.

export async function countQuestionsByStatus(desaId: string, since: Date) {
  const rows = await db.question.groupBy({
    by: ["status"],
    where: { desaId, createdAt: { gte: since } },
    _count: { _all: true },
  });
  return rows.map((row) => ({ status: row.status, count: row._count._all }));
}

export async function countRatings(desaId: string, since: Date) {
  const rows = await db.question.groupBy({
    by: ["isHelpful"],
    where: { desaId, createdAt: { gte: since }, isHelpful: { not: null } },
    _count: { _all: true },
  });
  return rows.map((row) => ({ isHelpful: row.isHelpful === true, count: row._count._all }));
}

const QUESTION_ROW = { id: true, text: true, status: true, isHelpful: true, createdAt: true } as const;

export function findRecentQuestions(desaId: string, take: number) {
  return db.question.findMany({ where: { desaId }, orderBy: { createdAt: "desc" }, take, select: QUESTION_ROW });
}

// Questions TanyaDesa could not answer: a hint for what data or Info desa to add.
export function findUnansweredQuestions(desaId: string, since: Date, take: number) {
  return db.question.findMany({
    where: { desaId, createdAt: { gte: since }, status: "NOT_FOUND" },
    orderBy: { createdAt: "desc" },
    take,
    select: QUESTION_ROW,
  });
}

// The budget rows cited most often in answers (per row; merged per account code by the caller).
export async function findMostCitedRows(desaId: string, since: Date, take: number) {
  const groups = await db.answerSource.groupBy({
    by: ["budgetItemId"],
    where: { question: { desaId, createdAt: { gte: since } } },
    _count: { budgetItemId: true },
    orderBy: { _count: { budgetItemId: "desc" } },
    take,
  });
  if (groups.length === 0) return [];

  const items = await db.budgetItem.findMany({
    where: { id: { in: groups.map((group) => group.budgetItemId) } },
    select: { id: true, accountCode: true, description: true },
  });
  return groups.flatMap((group) => {
    const item = items.find((candidate) => candidate.id === group.budgetItemId);
    return item ? [{ accountCode: item.accountCode, description: item.description, count: group._count.budgetItemId }] : [];
  });
}
