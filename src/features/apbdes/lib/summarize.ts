import type { ParsedBudgetItem } from "../types";

export interface GroupTotal {
  key: string;
  budget: number;
  realized: number;
  realizationRate: number; // 0 to 1
  share: number; // 0 to 1, portion of the grand total
}

export interface BudgetSummary {
  bySector: GroupTotal[];
  byDusun: GroupTotal[];
  byFundSource: GroupTotal[];
}

const WHOLE_VILLAGE = "Seluruh desa";

// Groups items by a key and sums budget and realization per group.
export function groupTotals(
  items: ParsedBudgetItem[],
  getKey: (item: ParsedBudgetItem) => string,
): GroupTotal[] {
  const groups = new Map<string, { budget: number; realized: number }>();

  for (const item of items) {
    const key = getKey(item);
    const current = groups.get(key) ?? { budget: 0, realized: 0 };
    groups.set(key, {
      budget: current.budget + item.budget,
      realized: current.realized + item.realized,
    });
  }

  const grandTotal = items.reduce((total, item) => total + item.budget, 0);

  return [...groups].map(([key, total]) => ({
    key,
    budget: total.budget,
    realized: total.realized,
    realizationRate: total.budget === 0 ? 0 : total.realized / total.budget,
    share: grandTotal === 0 ? 0 : total.budget / grandTotal,
  }));
}

export function summarize(items: ParsedBudgetItem[]): BudgetSummary {
  const expenditures = items.filter((item) => item.entryType === "EXPENDITURE");
  const revenues = items.filter((item) => item.entryType === "REVENUE");

  return {
    bySector: groupTotals(expenditures, (item) => String(item.sectorCode)),
    byDusun: groupTotals(expenditures, (item) => item.dusun ?? WHOLE_VILLAGE),
    byFundSource: groupTotals(revenues, (item) => item.fundSource),
  };
}