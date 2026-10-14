import type { EntryType, ParsedBudgetItem } from "../types";

export interface BalanceResult {
  totalRevenue: number;
  totalExpenditure: number;
  netFinancing: number;
  difference: number;
  isBalanced: boolean;
}

// Sum the budget of all items with the given entry type.
function sumBudget(items: ParsedBudgetItem[], entryType: EntryType): number {
  return items
    .filter((item) => item.entryType === entryType)
    .reduce((total, item) => total + item.budget, 0);
}

// An APBDes is balanced when: revenue + net financing = expenditure
export function checkBalance(items: ParsedBudgetItem[]): BalanceResult {
  const totalRevenue = sumBudget(items, "REVENUE");
  const totalExpenditure = sumBudget(items, "EXPENDITURE");

  // TODO 1: netFinancing = penerimaan pembiayaan − pengeluaran pembiayaan
  const netFinancing =
    sumBudget(items, "FINANCING_RECEIPT") - sumBudget(items, "FINANCING_EXPENDITURE");

  // TODO 2: difference = pendapatan + pembiayaan netto − belanja
  const difference = totalRevenue + netFinancing - totalExpenditure;

  return {
    totalRevenue,
    totalExpenditure,
    netFinancing,
    difference,
    // TODO 3: isBalanced bernilai true kalau difference sama dengan 0
    isBalanced: difference === 0,
  };
}
