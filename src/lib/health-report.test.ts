import { describe, expect, it } from "vitest";
import { buildHealthReport } from "./health-report";

describe("buildHealthReport", () => {
  const now = new Date("2026-10-16T06:00:00Z");

  it("reports ok with the database latency", () => {
    expect(buildHealthReport(true, 42, now)).toEqual({
      status: "ok",
      database: "ok",
      databaseLatencyMs: 42,
      checkedAt: "2026-10-16T06:00:00.000Z",
    });
  });

  it("reports degraded and hides latency when the database is down", () => {
    const report = buildHealthReport(false, 42, now);
    expect(report.status).toBe("degraded");
    expect(report.databaseLatencyMs).toBeNull();
  });
});
