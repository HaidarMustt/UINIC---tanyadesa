import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseApbdesExcel } from "./parse-excel";

const FIXTURE = "tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx";

describe("parseApbdesExcel", () => {
  const { items, warnings } = parseApbdesExcel(readFileSync(FIXTURE));

  it("reads all 37 budget rows without warnings", () => {
    expect(warnings).toEqual([]);
    expect(items).toHaveLength(37);
  });

  it("maps an expenditure row correctly", () => {
    const road = items.find((item) => item.accountCode === "2.1.01");

    expect(road).toMatchObject({
      entryType: "EXPENDITURE",
      sectorCode: 2,
      dusun: "Krajan",
      rt: "03",
      fundSource: "DD",
      budget: 185_000_000,
      realized: 185_000_000,
      status: "COMPLETED",
    });
  });

  it("treats 'Seluruh desa' as no specific dusun", () => {
    const salary = items.find((item) => item.accountCode === "1.1.01");

    expect(salary?.dusun).toBeNull();
    expect(salary?.rt).toBeNull();
  });

  it("maps revenue and financing rows", () => {
    const danaDesa = items.find((item) => item.accountCode === "4.2.1");
    const bumdes = items.find((item) => item.accountCode === "6.2.2");

    expect(danaDesa).toMatchObject({ entryType: "REVENUE", fundSource: "DD", sectorCode: null });
    expect(bumdes).toMatchObject({
      entryType: "FINANCING_EXPENDITURE",
      status: "NOT_STARTED",
    });
  });
});
