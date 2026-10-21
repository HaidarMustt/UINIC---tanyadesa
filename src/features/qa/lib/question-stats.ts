// Numbers for the "Pertanyaan warga" page. Pure function: the database counts go in,
// readable percentages come out.

export type QuestionStatus = "ANSWERED" | "NOT_FOUND" | "REFUSED" | "ERROR";

export interface QuestionStats {
  total: number;
  answered: number;
  notFound: number;
  refused: number;
  failed: number;
  answeredRate: number | null; // 0 to 1, null when there are no questions
  rated: number;
  helpful: number;
  helpfulRate: number | null; // 0 to 1, null when nobody has rated yet
}

export function buildQuestionStats(
  byStatus: { status: QuestionStatus; count: number }[],
  byRating: { isHelpful: boolean; count: number }[],
): QuestionStats {
  const count = (status: QuestionStatus) => byStatus.find((row) => row.status === status)?.count ?? 0;
  const total = byStatus.reduce((sum, row) => sum + row.count, 0);
  const answered = count("ANSWERED");
  const helpful = byRating.find((row) => row.isHelpful)?.count ?? 0;
  const rated = byRating.reduce((sum, row) => sum + row.count, 0);

  return {
    total,
    answered,
    notFound: count("NOT_FOUND"),
    refused: count("REFUSED"),
    failed: count("ERROR"),
    answeredRate: total === 0 ? null : answered / total,
    rated,
    helpful,
    helpfulRate: rated === 0 ? null : helpful / rated,
  };
}

// Each APBDes version has its own rows, so 2.1.01 in version 1 and 2.1.01 in version 2
// are different database rows. Residents ask about the same activity: count them together.
export interface CitedRow {
  accountCode: string;
  description: string;
  count: number;
}

export function mergeByAccountCode(rows: CitedRow[], take: number): CitedRow[] {
  const merged = new Map<string, CitedRow>();
  for (const row of rows) {
    const existing = merged.get(row.accountCode);
    if (existing) existing.count += row.count;
    else merged.set(row.accountCode, { ...row });
  }
  return [...merged.values()].sort((a, b) => b.count - a.count).slice(0, take);
}
