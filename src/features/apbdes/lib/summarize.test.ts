import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseApbdesExcel } from "./parse-excel";
import { summarize, type GroupTotal } from "./summarize";

const FIXTURE = "tests/fixtures/APBDes_Simulasi_Desa_Sukamaju_2026.xlsx";
const { items } = parseApbdesExcel(readFileSync(FIXTURE));
const summary = summarize(items);

// Helper: find one group by its key
const find = (groups: GroupTotal[], key: string) => groups.find((group) => group.key === key);

describe("summarize", () => {
  it("totals expenditure per sector", () => {
    expect(summary.bySector).toHaveLength(5);
    expect(find(summary.bySector, "2")).toMatchObject({
      budget: 790_000_000,
      realized: 531_300_000,
    });
  });

  it("totals expenditure per dusun, with village-wide items grouped together", () => {
    expect(find(summary.byDusun, "Ngemplak")).toMatchObject({ budget: 144_000_000 });
    expect(find(summary.byDusun, "Seluruh desa")).toMatchObject({ budget: 739_000_000 });
  });

  it("totals revenue per fund source", () => {
    expect(find(summary.byFundSource, "DD")).toMatchObject({ budget: 939_000_000 });
    expect(find(summary.byFundSource, "ADD")).toMatchObject({ budget: 422_000_000 });
  });

  it("calculates realization rate and share", () => {
    const development = find(summary.bySector, "2");

    expect(development?.realizationRate).toBeCloseTo(0.6725, 3);
    expect(development?.share).toBeCloseTo(0.5298, 3);
  });

  it("shares in each grouping add up to 100%", () => {
    const totalShare = summary.bySector.reduce((sum, group) => sum + group.share, 0);
    expect(totalShare).toBeCloseTo(1, 10);
  });
});
