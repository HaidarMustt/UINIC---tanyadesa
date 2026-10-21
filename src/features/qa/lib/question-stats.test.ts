import { describe, expect, it } from "vitest";
import { buildQuestionStats, mergeByAccountCode } from "./question-stats";

describe("buildQuestionStats", () => {
  it("computes the answered and helpful rates", () => {
    const stats = buildQuestionStats(
      [
        { status: "ANSWERED", count: 8 },
        { status: "NOT_FOUND", count: 1 },
        { status: "REFUSED", count: 1 },
      ],
      [
        { isHelpful: true, count: 3 },
        { isHelpful: false, count: 1 },
      ],
    );
    expect(stats).toMatchObject({ total: 10, answered: 8, answeredRate: 0.8, rated: 4, helpful: 3, helpfulRate: 0.75 });
  });

  it("gives no rate instead of 0% when there is nothing yet", () => {
    const stats = buildQuestionStats([], []);
    expect(stats.answeredRate).toBeNull();
    expect(stats.helpfulRate).toBeNull();
  });
});

describe("mergeByAccountCode", () => {
  it("counts the same activity from two APBDes versions once", () => {
    const merged = mergeByAccountCode(
      [
        { accountCode: "2.1.01", description: "Pengaspalan jalan", count: 10 },
        { accountCode: "2.1.03", description: "Talud", count: 5 },
        { accountCode: "2.1.01", description: "Pengaspalan jalan", count: 5 },
      ],
      5,
    );
    expect(merged).toEqual([
      { accountCode: "2.1.01", description: "Pengaspalan jalan", count: 15 },
      { accountCode: "2.1.03", description: "Talud", count: 5 },
    ]);
  });
});
