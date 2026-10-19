// How far the activities (belanja) have come: counts per status and the ones not started yet.
// Pure function, so the summary page and the API can share it.

import type { ParsedBudgetItem } from "../types";

export interface PendingActivity {
  accountCode: string;
  description: string;
  dusun: string | null;
  budget: number;
}

export interface ActivityProgress {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  notStartedItems: PendingActivity[]; // biggest first
}

export function activityProgress(items: ParsedBudgetItem[]): ActivityProgress {
  const activities = items.filter((item) => item.entryType === "EXPENDITURE");
  const notStartedItems = activities
    .filter((item) => item.status === "NOT_STARTED")
    .sort((a, b) => b.budget - a.budget)
    .map(({ accountCode, description, dusun, budget }) => ({ accountCode, description, dusun, budget }));

  return {
    total: activities.length,
    completed: activities.filter((item) => item.status === "COMPLETED").length,
    inProgress: activities.filter((item) => item.status === "IN_PROGRESS").length,
    notStarted: notStartedItems.length,
    notStartedItems,
  };
}
