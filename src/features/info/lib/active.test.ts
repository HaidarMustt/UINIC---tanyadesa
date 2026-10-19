import { describe, expect, it } from "vitest";
import { isInfoActive } from "./active";

// validUntil is stored as midnight WIB of the last day, like the upload form's dates.
const lastDay = new Date("2026-11-01T00:00:00+07:00");

describe("isInfoActive", () => {
  it("keeps entries without an end date", () => {
    expect(isInfoActive(null)).toBe(true);
  });

  it("shows an announcement through its whole last day (WIB)", () => {
    expect(isInfoActive(lastDay, new Date("2026-11-01T22:30:00+07:00"))).toBe(true);
  });

  it("hides it from the next day", () => {
    expect(isInfoActive(lastDay, new Date("2026-11-02T00:05:00+07:00"))).toBe(false);
  });
});
