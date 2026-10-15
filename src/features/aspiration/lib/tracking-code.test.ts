import { describe, expect, it } from "vitest";
import { TrackingCodeSchema } from "../schemas";
import { generateTrackingCode, TRACKING_CODE_LENGTH } from "./tracking-code";

describe("generateTrackingCode", () => {
  it("makes codes that pass validation", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateTrackingCode();
      expect(code).toHaveLength(TRACKING_CODE_LENGTH);
      expect(TrackingCodeSchema.safeParse(code).success).toBe(true);
    }
  });

  it("does not repeat in practice", () => {
    const codes = new Set(Array.from({ length: 1000 }, generateTrackingCode));
    expect(codes.size).toBe(1000);
  });
});
