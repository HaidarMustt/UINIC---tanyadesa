import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseApbdesExcel } from "./parse-excel";
import { activityProgress } from "./progress";

const { items } = parseApbdesExcel(readFileSync("tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx"));

describe("activityProgress", () => {
  it("counts only activities (belanja) and adds up", () => {
    const progress = activityProgress(items);
    const expenditureCount = items.filter((item) => item.entryType === "EXPENDITURE").length;
    expect(progress.total).toBe(expenditureCount);
    expect(progress.completed + progress.inProgress + progress.notStarted).toBe(progress.total);
  });

  it("lists the activities not started yet, biggest first", () => {
    const { notStartedItems } = activityProgress(items);
    expect(notStartedItems.map((item) => item.accountCode)).toEqual(["2.1.03", "2.1.06", "4.1.01"]);
  });
});
