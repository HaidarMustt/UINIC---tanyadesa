// The "Pertanyaan warga" page: what residents ask, what TanyaDesa could not answer,
// and how helpful residents found the answers. Read-only, for operators and BPD.

import { ValidationError } from "@/lib/errors";
import { buildQuestionStats, mergeByAccountCode } from "../lib/question-stats";
import {
  countQuestionsByStatus,
  countRatings,
  findMostCitedRows,
  findRecentQuestions,
  findUnansweredQuestions,
} from "./qa.repository";

export const PERIOD_DAYS = 30;

export async function getQuestionPanel(officer: { desa: { id: string } | null }) {
  if (!officer.desa) throw new ValidationError("Akun ini tidak terhubung ke desa mana pun.");
  const desaId = officer.desa.id;
  const since = new Date(Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const [byStatus, byRating, recent, unanswered, mostAsked] = await Promise.all([
    countQuestionsByStatus(desaId, since),
    countRatings(desaId, since),
    findRecentQuestions(desaId, 30),
    findUnansweredQuestions(desaId, since, 10),
    // More rows than shown, because one activity can appear once per APBDes version.
    findMostCitedRows(desaId, since, 20),
  ]);

  return { stats: buildQuestionStats(byStatus, byRating), recent, unanswered, mostAsked: mergeByAccountCode(mostAsked, 5) };
}
