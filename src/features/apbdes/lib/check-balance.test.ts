import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkBalance } from "./check-balance";
import { parseApbdesExcel } from "./parse-excel";

const FIXTURE = "tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx";
const { items } = parseApbdesExcel(readFileSync(FIXTURE));

describe("checkBalance", () => {
  it("calculates totals from the simulation APBDes", () => {
    const result = checkBalance(items);

    // TODO 1: totalRevenue harus sama dengan Total Pendapatan dari Excel
    expect(result.totalRevenue).toBe(1_506_000_000);
    // TODO 2: totalExpenditure harus sama dengan Total Belanja dari Excel
    expect(result.totalExpenditure).toBe(1_491_000_000);
    // TODO 3: netFinancing harus sama dengan Pembiayaan Netto dari Excel
    expect(result.netFinancing).toBe(-15_000_000);
  });

  it("marks the simulation APBDes as balanced", () => {
    const result = checkBalance(items);

    // TODO 4: difference harus 0, dan isBalanced harus true
    expect(result.difference).toBe(0);
    expect(result.isBalanced).toBe(true);
  });

  it("detects an unbalanced budget", () => {
    // Salin semua item, tapi anggaran jalan RT 03 (2.1.01) ditambah 10 juta
    const changed = items.map((item) =>
      item.accountCode === "2.1.01" ? { ...item, budget: item.budget + 10_000_000 } : item,
    );
    const result = checkBalance(changed);

    // TODO 5: isBalanced harus false
    expect(result.isBalanced).toBe(false);
    // TODO 6: difference harus berapa? (pikirkan: belanja naik 10 juta, pendapatan tetap)
    expect(result.difference).toBe(-10_000_000);
  });
});
